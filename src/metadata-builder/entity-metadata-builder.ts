import { Connection } from "../connection/Connection";
import { MysqlDriver } from "../driver/mysql/MysqlDriver";
import { MetadataArgsStorage } from "../metadata-args/MetadataArgsStorage";
import { TableMetadataArgs } from "../metadata-args/TableMetadataArgs";
import { CheckMetadata } from "../metadata/CheckMetadata";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { EmbeddedMetadata } from "../metadata/EmbeddedMetadata";
import { EntityListenerMetadata } from "../metadata/EntityListenerMetadata";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { IndexMetadata } from "../metadata/IndexMetadata";
import { RelationCountMetadata } from "../metadata/RelationCountMetadata";
import { RelationIdMetadata } from "../metadata/RelationIdMetadata";
import { RelationMetadata } from "../metadata/RelationMetadata";
import { UniqueMetadata } from "../metadata/UniqueMetadata";
import { MetadataUtils } from "./MetadataUtils";

/**
 * Builds EntityMetadata objects and all its sub-metadatas.
 */
export class EntityMetadataBuilder {
  /**
   * Builds a complete entity metadatas for the given entity classes.
   */
  public build(entityClasses?: Function[]): EntityMetadata[] {
    // if entity classes to filter entities by are given then do filtering, otherwise use all
    const allTables = entityClasses
      ? this.metadataArgsStorage.filterTables(entityClasses)
      : this.metadataArgsStorage.tables;

    // filter out table metadata args for those we really create entity metadatas and tables in the db
    const realTables = allTables.filter(
      table => table.type === "regular" || table.type === "closure" || table.type === "entity-child"
    );

    // create entity metadatas for a user defined entities (marked with @Entity decorator or loaded from entity schemas)
    const entityMetadatas = realTables.map(tableArgs => this.createEntityMetadata(tableArgs));

    // compute parent entity metadatas for table inheritance
    entityMetadatas.forEach(entityMetadata => this.computeParentEntityMetadata(entityMetadatas, entityMetadata));

    // after all metadatas created we set child entity metadatas for table inheritance
    entityMetadatas.forEach(metadata => {
      metadata.childEntityMetadatas = entityMetadatas.filter(childMetadata => {
        return (
          metadata.target instanceof Function &&
          childMetadata.target instanceof Function &&
          MetadataUtils.isInherited(childMetadata.target, metadata.target)
        );
      });
    });

    // build entity metadata (step0), first for non-single-table-inherited entity metadatas (dependant)
    entityMetadatas
      .filter(entityMetadata => entityMetadata.tableType !== "entity-child")
      .forEach(entityMetadata => entityMetadata.build());

    // compute entity metadata columns, relations, etc. first for the regular, non-single-table-inherited entity metadatas
    entityMetadatas
      .filter(entityMetadata => entityMetadata.tableType !== "entity-child")
      .forEach(entityMetadata => this.computeEntityMetadataStep1(entityMetadatas, entityMetadata));

    // calculate entity metadata computed properties and all its sub-metadatas
    entityMetadatas.forEach(entityMetadata => this.computeEntityMetadataStep2(entityMetadata));

    // calculate entity metadata's inverse properties
    entityMetadatas.forEach(entityMetadata => this.computeInverseProperties(entityMetadata, entityMetadatas));

    // build all indices (need to do it after relations and their join columns are built)
    entityMetadatas.forEach(entityMetadata => {
      entityMetadata.indices.forEach(index => index.build(this.connection.namingStrategy));
    });

    // build all unique constraints (need to do it after relations and their join columns are built)
    entityMetadatas.forEach(entityMetadata => {
      entityMetadata.uniques.forEach(unique => unique.build(this.connection.namingStrategy));
    });

    // build all check constraints
    entityMetadatas.forEach(entityMetadata => {
      entityMetadata.checks.forEach(check => check.build(this.connection.namingStrategy));
    });

    entityMetadatas.forEach(entityMetadata => {
      entityMetadata.columns.forEach(column => {
        // const target = column.embeddedMetadata ? column.embeddedMetadata.type : column.target;
        const generated = this.metadataArgsStorage.findGenerated(column.target, column.propertyName);
        if (generated) {
          column.isGenerated = true;
          column.generationStrategy = generated.strategy;
          column.type = generated.strategy === "increment" ? column.type || Number : "uuid";
          column.build(this.connection);
          this.computeEntityMetadataStep2(entityMetadata);
        }
      });
    });

    return entityMetadatas;
  }

  constructor(private connection: Connection, private metadataArgsStorage: MetadataArgsStorage) {}

  /**
   * Creates entity metadata from the given table args.
   * Creates column, relation, etc. metadatas for everything this entity metadata owns.
   */
  protected createEntityMetadata(tableArgs: TableMetadataArgs): EntityMetadata {
    // we take all "inheritance tree" from a target entity to collect all stored metadata args
    // (by decorators or inside entity schemas). For example for target Post < ContentModel < Unit
    // it will be an array of [Post, ContentModel, Unit] and we can then get all metadata args of those classes
    const inheritanceTree: any[] =
      tableArgs.target instanceof Function ? MetadataUtils.getInheritanceTree(tableArgs.target) : [tableArgs.target]; // todo: implement later here inheritance for string-targets

    const tableInheritance = this.metadataArgsStorage.findInheritanceType(tableArgs.target);
    const tableTree = this.metadataArgsStorage.findTree(tableArgs.target);

    // if single table inheritance used, we need to copy all children columns in to parent table
    let singleTableChildrenTargets: any[];
    if ((tableInheritance && tableInheritance.pattern === "STI") || tableArgs.type === "entity-child") {
      singleTableChildrenTargets = this.metadataArgsStorage
        .filterSingleTableChildren(tableArgs.target)
        .map(args => args.target)
        .filter(target => target instanceof Function);

      inheritanceTree.push(...singleTableChildrenTargets);
    }

    return new EntityMetadata({
      connection: this.connection,
      args: tableArgs,
      inheritanceTree: inheritanceTree,
      tableTree: tableTree,
      inheritancePattern: tableInheritance ? tableInheritance.pattern : undefined,
    });
  }

  protected computeParentEntityMetadata(allEntityMetadatas: EntityMetadata[], entityMetadata: EntityMetadata) {
    // after all metadatas created we set parent entity metadata for table inheritance
    if (entityMetadata.tableType === "entity-child") {
      entityMetadata.parentEntityMetadata = allEntityMetadatas.find(allEntityMetadata => {
        return (
          allEntityMetadata.inheritanceTree.indexOf(entityMetadata.target as Function) !== -1 &&
          allEntityMetadata.inheritancePattern === "STI"
        );
      })!;
    }
  }

  protected computeEntityMetadataStep1(allEntityMetadatas: EntityMetadata[], entityMetadata: EntityMetadata) {
    const entityInheritance = this.metadataArgsStorage.findInheritanceType(entityMetadata.target);

    const discriminatorValue = this.metadataArgsStorage.findDiscriminatorValue(entityMetadata.target);
    entityMetadata.discriminatorValue = discriminatorValue
      ? discriminatorValue.value
      : (entityMetadata.target as any).name; // todo: pass this to naming strategy to generate a name

    // if single table inheritance is used, we need to mark all embedded columns as nullable
    entityMetadata.embeddeds = this.createEmbeddedsRecursively(
      entityMetadata,
      this.metadataArgsStorage.filterEmbeddeds(entityMetadata.inheritanceTree)
    ).map(
      (embedded: EmbeddedMetadata): EmbeddedMetadata => {
        if (entityMetadata.inheritancePattern === "STI") {
          embedded.columns = embedded.columns.map(
            (column: ColumnMetadata): ColumnMetadata => {
              column.isNullable = true;
              return column;
            }
          );
        }
        return embedded;
      }
    );

    entityMetadata.ownColumns = this.metadataArgsStorage.filterColumns(entityMetadata.inheritanceTree).map(args => {
      // for single table children we reuse columns created for their parents
      if (entityMetadata.tableType === "entity-child")
        return entityMetadata.parentEntityMetadata.ownColumns.find(
          column => column.propertyName === args.propertyName
        )!;

      const column = new ColumnMetadata({ connection: this.connection, entityMetadata, args });

      // if single table inheritance used, we need to mark all inherit table columns as nullable
      const columnInSingleTableInheritedChild = allEntityMetadatas.find(
        otherEntityMetadata =>
          otherEntityMetadata.tableType === "entity-child" && otherEntityMetadata.target === args.target
      );
      if (columnInSingleTableInheritedChild) column.isNullable = true;
      return column;
    });

    entityMetadata.ownRelations = this.metadataArgsStorage.filterRelations(entityMetadata.inheritanceTree).map(args => {
      // for single table children we reuse relations created for their parents
      if (entityMetadata.tableType === "entity-child")
        return entityMetadata.parentEntityMetadata.ownRelations.find(
          relation => relation.propertyName === args.propertyName
        )!;

      return new RelationMetadata({ entityMetadata, args });
    });
    entityMetadata.relationIds = this.metadataArgsStorage
      .filterRelationIds(entityMetadata.inheritanceTree)
      .map(args => {
        // for single table children we reuse relation ids created for their parents
        if (entityMetadata.tableType === "entity-child")
          return entityMetadata.parentEntityMetadata.relationIds.find(
            relationId => relationId.propertyName === args.propertyName
          )!;

        return new RelationIdMetadata({ entityMetadata, args });
      });
    entityMetadata.relationCounts = this.metadataArgsStorage
      .filterRelationCounts(entityMetadata.inheritanceTree)
      .map(args => {
        // for single table children we reuse relation counts created for their parents
        if (entityMetadata.tableType === "entity-child")
          return entityMetadata.parentEntityMetadata.relationCounts.find(
            relationCount => relationCount.propertyName === args.propertyName
          )!;

        return new RelationCountMetadata({ entityMetadata, args });
      });
    entityMetadata.ownIndices = this.metadataArgsStorage.filterIndices(entityMetadata.inheritanceTree).map(args => {
      return new IndexMetadata({ entityMetadata, args });
    });
    entityMetadata.ownListeners = this.metadataArgsStorage.filterListeners(entityMetadata.inheritanceTree).map(args => {
      return new EntityListenerMetadata({ entityMetadata: entityMetadata, args: args });
    });
    entityMetadata.checks = this.metadataArgsStorage.filterChecks(entityMetadata.inheritanceTree).map(args => {
      return new CheckMetadata({ entityMetadata, args });
    });

    // Mysql stores unique constraints as unique indices.
    if (this.connection.driver instanceof MysqlDriver) {
      const indices = this.metadataArgsStorage.filterUniques(entityMetadata.inheritanceTree).map(args => {
        return new IndexMetadata({
          entityMetadata: entityMetadata,
          args: {
            target: args.target,
            name: args.name,
            columns: args.columns,
            unique: true,
            synchronize: true,
          },
        });
      });
      entityMetadata.ownIndices.push(...indices);
    } else {
      entityMetadata.uniques = this.metadataArgsStorage.filterUniques(entityMetadata.inheritanceTree).map(args => {
        return new UniqueMetadata({ entityMetadata, args });
      });
    }
  }
}
