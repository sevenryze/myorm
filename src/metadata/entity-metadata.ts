import { ColumnMetadata } from "./ColumnMetadata";
import { RelationMetadata } from "./RelationMetadata";
import { IndexMetadata } from "./IndexMetadata";
import { ForeignKeyMetadata } from "./ForeignKeyMetadata";
import { EmbeddedMetadata } from "./EmbeddedMetadata";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { RelationIdMetadata } from "./RelationIdMetadata";
import { RelationCountMetadata } from "./RelationCountMetadata";
import { TableType } from "./types/TableTypes";
import { OrderByCondition } from "../find-options/OrderByCondition";
import { OrmUtils } from "../util/OrmUtils";
import { TableMetadataArgs } from "../metadata-args/TableMetadataArgs";
import { Connection } from "../connection/Connection";
import { EntityListenerMetadata } from "./EntityListenerMetadata";
import { PostgresDriver } from "../driver/postgres/PostgresDriver";
import { SqlServerDriver } from "../driver/sqlserver/SqlServerDriver";
import { PostgresConnectionOptions } from "../driver/postgres/PostgresConnectionOptions";
import { SqlServerConnectionOptions } from "../driver/sqlserver/SqlServerConnectionOptions";
import { CannotCreateEntityIdMapError } from "../error/CannotCreateEntityIdMapError";
import { TreeType } from "./types/TreeTypes";
import { TreeMetadataArgs } from "../metadata-args/TreeMetadataArgs";
import { UniqueMetadata } from "./UniqueMetadata";
import { CheckMetadata } from "./CheckMetadata";
import { QueryRunner } from "..";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  /**
   * Connection where this entity metadata is created.
   */
  connection: Connection;

  /**
   * Metadata arguments used to build this entity metadata.
   */
  tableMetadataArgs: TableMetadataArgs;

  /**
   * Parent's entity metadata. Used in inheritance patterns.
   */
  parentEntityMetadata: EntityMetadata;

  /**
   * Children entity metadatas. Used in inheritance patterns.
   */
  childEntityMetadatas: EntityMetadata[] = [];

  /**
   * Table type. Tables can be abstract, closure, junction, embedded, etc.
   */
  tableType: TableType = "regular";

  /**
   * Target class to which this entity metadata is bind.
   * Note, that when using table inheritance patterns target can be different rather then table's target.
   * For virtual tables which lack of real entity (like junction tables) target is equal to their table name.
   */
  target: Function | string;

  /**
   * Gets the name of the target.
   */
  targetName: string;

  /**
   * Entity's name.
   * Equal to entity target class's name if target is set to table.
   * If target class is not then then it equals to table name.
   */
  name: string;

  /**
   * Original user-given table name (taken from schema or @Entity(tableName) decorator).
   * If user haven't specified a table name this property will be undefined.
   */
  givenTableName?: string;

  /**
   * Entity table name in the database.
   * This is final table name of the entity.
   * This name already passed naming strategy, and generated based on
   * multiple criteria, including user table name and global table prefix.
   */
  tableName: string;

  /**
   * Entity table path. Contains database name, schema name and table name.
   * E.g. myDB.mySchema.myTable
   */
  tablePath: string;

  /**
   * Entity schema path. Contains database name and schema name.
   * E.g. myDB.mySchema
   */
  schemaPath?: string;

  /**
   * Gets the table name without global table prefix.
   * When querying table you need a table name with prefix, but in some scenarios,
   * for example when you want to name a junction table that contains names of two other tables,
   * you may want a table name without prefix.
   */
  tableNameWithoutPrefix: string;

  /**
   * Indicates if schema will be synchronized for this entity or not.
   */
  synchronize: boolean = true;

  /**
   * Table's database engine type (like "InnoDB", "MyISAM", etc).
   */
  engine?: string;

  /**
   * Database name.
   */
  database?: string;

  /**
   * Schema name. Used in Postgres and Sql Server.
   */
  schema?: string;

  /**
   * Specifies a default order by used for queries from this table when no explicit order by is specified.
   */
  orderBy?: OrderByCondition;

  /**
   * Checks if entity's table has multiple primary columns.
   */
  hasMultiplePrimaryKeys: boolean = false;

  /**
   * Indicates if this entity metadata has uuid generated columns.
   */
  hasUUIDGeneratedColumns: boolean = false;

  /**
   * Entity's column metadatas defined by user.
   */
  ownColumns: ColumnMetadata[] = [];

  /**
   * Columns of the entity, including columns that are coming from the embeddeds of this entity.
   */
  columns: ColumnMetadata[] = [];

  /**
   * All columns except for virtual columns.
   */
  nonVirtualColumns: ColumnMetadata[] = [];

  /**
   * Gets the column with generated flag.
   */
  generatedColumns: ColumnMetadata[] = [];

  /**
   * Gets the object id column used with mongodb database.
   */
  objectIdColumn?: ColumnMetadata;

  /**
   * Gets entity column which contains a create date value.
   */
  createDateColumn?: ColumnMetadata;

  /**
   * Gets entity column which contains an update date value.
   */
  updateDateColumn?: ColumnMetadata;

  /**
   * Gets entity column which contains an entity version.
   */
  versionColumn?: ColumnMetadata;

  /**
   * Gets the primary columns.
   */
  primaryColumns: ColumnMetadata[] = [];

  /**
   * Entity's foreign key metadatas.
   */
  foreignKeys: ForeignKeyMetadata[] = [];

  /**
   * Entity's own indices.
   */
  ownIndices: IndexMetadata[] = [];

  /**
   * Entity's index metadatas.
   */
  indices: IndexMetadata[] = [];

  /**
   * Entity's unique metadatas.
   */
  uniques: UniqueMetadata[] = [];

  /**
   * Entity's check metadatas.
   */
  checks: CheckMetadata[] = [];

  /**
   * Map of columns and relations of the entity.
   *
   * example: Post{ id: number, name: string, counterEmbed: { count: number }, category: Category }.
   * This method will create following object:
   * { id: "id", counterEmbed: { count: "counterEmbed.count" }, category: "category" }
   */
  propertiesMap: ObjectLiteral;

  /**
   * Creates a new entity.
   */
  create(queryRunner?: QueryRunner): any {
    // if target is set to a function (e.g. class) that can be created then create it
    let ret: any;
    if (this.target instanceof Function) {
      ret = new (<any>this.target)();
      this.lazyRelations.forEach(relation => this.connection.relationLoader.enableLazyLoad(relation, ret, queryRunner));
      return ret;
    }

    // otherwise simply return a new empty object
    const newObject = {};
    this.lazyRelations.forEach(relation =>
      this.connection.relationLoader.enableLazyLoad(relation, newObject, queryRunner)
    );
    return newObject;
  }

  /**
   * Checks if given entity has an id.
   */
  hasId(entity: ObjectLiteral): boolean {
    if (!entity) return false;

    return this.primaryColumns.every(primaryColumn => {
      const value = primaryColumn.getEntityValue(entity);
      return value !== null && value !== undefined && value !== "";
    });
  }

  /**
   * Checks if given entity / object contains ALL primary keys entity must have.
   * Returns true if it contains all of them, false if at least one of them is not defined.
   */
  hasAllPrimaryKeys(entity: ObjectLiteral): boolean {
    return this.primaryColumns.every(primaryColumn => {
      const value = primaryColumn.getEntityValue(entity);
      return value !== null && value !== undefined;
    });
  }

  /**
   * Ensures that given object is an entity id map.
   * If given id is an object then it means its already id map.
   * If given id isn't an object then it means its a value of the id column
   * and it creates a new id map with this value and name of the primary column.
   */
  ensureEntityIdMap(id: any): ObjectLiteral {
    if (id instanceof Object) return id;

    if (this.hasMultiplePrimaryKeys) throw new CannotCreateEntityIdMapError(this, id);

    return this.primaryColumns[0].createValueMap(id);
  }

  /**
   * Gets primary keys of the entity and returns them in a literal object.
   * For example, for Post{ id: 1, title: "hello" } where id is primary it will return { id: 1 }
   * For multiple primary keys it returns multiple keys in object.
   * For primary keys inside embeds it returns complex object literal with keys in them.
   */
  getEntityIdMap(entity: ObjectLiteral | undefined): ObjectLiteral | undefined {
    if (!entity) return undefined;

    return EntityMetadata.getValueMap(entity, this.primaryColumns, { skipNulls: true });
  }

  /**
   * Creates a "mixed id map".
   * If entity has multiple primary keys (ids) then it will return just regular id map, like what getEntityIdMap returns.
   * But if entity has a single primary key then it will return just value of the id column of the entity, just value.
   * This is called mixed id map.
   */
  getEntityIdMixedMap(entity: ObjectLiteral | undefined): ObjectLiteral | undefined {
    if (!entity) return entity;

    const idMap = this.getEntityIdMap(entity);
    if (this.hasMultiplePrimaryKeys) {
      return idMap;
    } else if (idMap) {
      return this.primaryColumns[0].getEntityValue(idMap); // todo: what about parent primary column?
    }

    return idMap;
  }

  /**
   * Compares two different entities by their ids.
   * Returns true if they match, false otherwise.
   */
  compareEntities(firstEntity: ObjectLiteral, secondEntity: ObjectLiteral): boolean {
    const firstEntityIdMap = this.getEntityIdMap(firstEntity);
    if (!firstEntityIdMap) return false;

    const secondEntityIdMap = this.getEntityIdMap(secondEntity);
    if (!secondEntityIdMap) return false;

    return EntityMetadata.compareIds(firstEntityIdMap, secondEntityIdMap);
  }

  /**
   * Finds column with a given property name.
   */
  findColumnWithPropertyName(propertyName: string): ColumnMetadata | undefined {
    return this.columns.find(column => column.propertyName === propertyName);
  }

  /**
   * Finds column with a given database name.
   */
  findColumnWithDatabaseName(databaseName: string): ColumnMetadata | undefined {
    return this.columns.find(column => column.databaseName === databaseName);
  }

  /**
   * Finds column with a given property path.
   */
  findColumnWithPropertyPath(propertyPath: string): ColumnMetadata | undefined {
    const column = this.columns.find(column => column.propertyPath === propertyPath);
    if (column) return column;

    // in the case if column with property path was not found, try to find a relation with such property path
    // if we find relation and it has a single join column then its the column user was seeking
    const relation = this.relations.find(relation => relation.propertyPath === propertyPath);
    if (relation && relation.joinColumns.length === 1) return relation.joinColumns[0];

    return undefined;
  }

  /**
   * Finds columns with a given property path.
   * Property path can match a relation, and relations can contain multiple columns.
   */
  findColumnsWithPropertyPath(propertyPath: string): ColumnMetadata[] {
    const column = this.columns.find(column => column.propertyPath === propertyPath);
    if (column) return [column];

    // in the case if column with property path was not found, try to find a relation with such property path
    // if we find relation and it has a single join column then its the column user was seeking
    const relation = this.relations.find(relation => relation.propertyPath === propertyPath);
    if (relation && relation.joinColumns) return relation.joinColumns;

    return [];
  }

  /**
   * Finds relation with the given property path.
   */
  findRelationWithPropertyPath(propertyPath: string): RelationMetadata | undefined {
    return this.relations.find(relation => relation.propertyPath === propertyPath);
  }

  /**
   * Checks if there is an embedded with a given property path.
   */
  hasEmbeddedWithPropertyPath(propertyPath: string): boolean {
    return this.allEmbeddeds.some(embedded => embedded.propertyPath === propertyPath);
  }

  /**
   * Finds embedded with a given property path.
   */
  findEmbeddedWithPropertyPath(propertyPath: string): EmbeddedMetadata | undefined {
    return this.allEmbeddeds.find(embedded => embedded.propertyPath === propertyPath);
  }

  /**
   * Iterates through entity and finds and extracts all values from relations in the entity.
   * If relation value is an array its being flattened.
   */
  extractRelationValuesFromEntity(
    entity: ObjectLiteral,
    relations: RelationMetadata[]
  ): [RelationMetadata, any, EntityMetadata][] {
    const relationsAndValues: [RelationMetadata, any, EntityMetadata][] = [];
    relations.forEach(relation => {
      const value = relation.getEntityValue(entity);
      if (value instanceof Array) {
        value.forEach(subValue => relationsAndValues.push([relation, subValue, relation.inverseEntityMetadata]));
      } else if (value) {
        relationsAndValues.push([relation, value, relation.inverseEntityMetadata]);
      }
    });
    return relationsAndValues;
  }

  // -------------------------------------------------------------------------
  // Public Static Methods
  // -------------------------------------------------------------------------

  /**
   * Creates a property paths for a given entity.
   */
  static createPropertyPath(metadata: EntityMetadata, entity: ObjectLiteral, prefix: string = "") {
    const paths: string[] = [];
    Object.keys(entity).forEach(key => {
      // check for function is needed in the cases when createPropertyPath used on values containg a function as a value
      // example: .update().set({ name: () => `SUBSTR('', 1, 2)` })
      const parentPath = prefix ? prefix + "." + key : key;
      if (metadata.hasEmbeddedWithPropertyPath(parentPath)) {
        const subPaths = this.createPropertyPath(metadata, entity[key], parentPath);
        paths.push(...subPaths);
      } else {
        const path = prefix ? prefix + "." + key : key;
        paths.push(path);
      }
    });
    return paths;
  }

  /**
   * Finds difference between two entity id maps.
   * Returns items that exist in the first array and absent in the second array.
   */
  static difference(firstIdMaps: ObjectLiteral[], secondIdMaps: ObjectLiteral[]): ObjectLiteral[] {
    return firstIdMaps.filter(firstIdMap => {
      return !secondIdMaps.find(secondIdMap => OrmUtils.deepCompare(firstIdMap, secondIdMap));
    });
  }

  /**
   * Compares ids of the two entities.
   * Returns true if they match, false otherwise.
   */
  static compareIds(firstId: ObjectLiteral | undefined, secondId: ObjectLiteral | undefined): boolean {
    if (firstId === undefined || firstId === null || secondId === undefined || secondId === null) return false;

    return OrmUtils.deepCompare(firstId, secondId);
  }

  /**
   * Creates value map from the given values and columns.
   * Examples of usages are primary columns map and join columns map.
   */
  static getValueMap(
    entity: ObjectLiteral,
    columns: ColumnMetadata[],
    options?: { skipNulls?: boolean }
  ): ObjectLiteral | undefined {
    return columns.reduce(
      (map, column) => {
        const value = column.getEntityValueMap(entity, options);

        // make sure that none of the values of the columns are not missing
        if (map === undefined || value === null || value === undefined) return undefined;

        return column.isObjectId ? Object.assign(map, value) : OrmUtils.mergeDeep(map, value);
      },
      {} as ObjectLiteral | undefined
    );
  }

  build() {
    const namingStrategy = this.connection.namingStrategy;
    const entityPrefix = this.connection.options.entityPrefix;
    this.engine = this.tableMetadataArgs.engine;
    this.database =
      this.tableMetadataArgs.type === "entity-child" && this.parentEntityMetadata
        ? this.parentEntityMetadata.database
        : this.tableMetadataArgs.database;
    this.schema =
      this.tableMetadataArgs.schema ||
      (this.connection.options as PostgresConnectionOptions | SqlServerConnectionOptions).schema;
    this.givenTableName =
      this.tableMetadataArgs.type === "entity-child" && this.parentEntityMetadata
        ? this.parentEntityMetadata.givenTableName
        : this.tableMetadataArgs.name;
    this.synchronize = this.tableMetadataArgs.synchronize === false ? false : true;
    this.targetName =
      this.tableMetadataArgs.target instanceof Function
        ? (this.tableMetadataArgs.target as any).name
        : this.tableMetadataArgs.target;
    this.tableNameWithoutPrefix = namingStrategy.tableName(this.targetName, this.givenTableName);
    this.tableName = entityPrefix
      ? namingStrategy.prefixTableName(entityPrefix, this.tableNameWithoutPrefix)
      : this.tableNameWithoutPrefix;
    this.target = this.target ? this.target : this.tableName;
    this.name = this.targetName ? this.targetName : this.tableName;
    this.tablePath = this.buildTablePath();
    this.schemaPath = this.buildSchemaPath();
    this.orderBy =
      this.tableMetadataArgs.orderBy instanceof Function
        ? this.tableMetadataArgs.orderBy(this.propertiesMap)
        : this.tableMetadataArgs.orderBy; // todo: is propertiesMap available here? Looks like its not
  }

  /**
   * Registers a new column in the entity and recomputes all depend properties.
   */
  registerColumn(column: ColumnMetadata) {
    if (this.ownColumns.indexOf(column) !== -1) return;

    this.ownColumns.push(column);
    this.columns = this.embeddeds.reduce(
      (columns, embedded) => columns.concat(embedded.columnsFromTree),
      this.ownColumns
    );
    this.primaryColumns = this.columns.filter(column => column.isPrimary);
    this.hasMultiplePrimaryKeys = this.primaryColumns.length > 1;
    this.hasUUIDGeneratedColumns =
      this.columns.filter(column => column.isGenerated || column.generationStrategy === "uuid").length > 0;
    this.propertiesMap = this.createPropertiesMap();
    if (this.childEntityMetadatas)
      this.childEntityMetadatas.forEach(entityMetadata => entityMetadata.registerColumn(column));
  }

  /**
   * Creates a special object - all columns and relations of the object (plus columns and relations from embeds)
   * in a special format - { propertyName: propertyName }.
   *
   * example: Post{ id: number, name: string, counterEmbed: { count: number }, category: Category }.
   * This method will create following object:
   * { id: "id", counterEmbed: { count: "counterEmbed.count" }, category: "category" }
   */
  createPropertiesMap(): { [name: string]: string | any } {
    const map: { [name: string]: string | any } = {};
    this.columns.forEach(column => OrmUtils.mergeDeep(map, column.createValueMap(column.propertyPath)));
    this.relations.forEach(relation => OrmUtils.mergeDeep(map, relation.createValueMap(relation.propertyPath)));
    return map;
  }

  /**
   * Builds table path using database name, schema name and table name.
   */
  protected buildTablePath(): string {
    let tablePath = this.tableName;
    if (this.schema) tablePath = this.schema + "." + tablePath;
    if (this.database && !(this.connection.driver instanceof PostgresDriver)) {
      if (!this.schema && this.connection.driver instanceof SqlServerDriver) {
        tablePath = this.database + ".." + tablePath;
      } else {
        tablePath = this.database + "." + tablePath;
      }
    }

    return tablePath;
  }

  /**
   * Builds table path using schema name and database name.
   */
  protected buildSchemaPath(): string | undefined {
    if (!this.schema) return undefined;

    return this.database && !(this.connection.driver instanceof PostgresDriver)
      ? this.database + "." + this.schema
      : this.schema;
  }

  constructor(options: {
    connection: Connection;
    inheritanceTree?: Function[];
    inheritancePattern?: "STI" /*|"CTI"*/;
    tableTree?: TreeMetadataArgs;
    parentClosureEntityMetadata?: EntityMetadata;
    args: TableMetadataArgs;
  }) {
    this.connection = options.connection;
    this.inheritanceTree = options.inheritanceTree || [];
    this.inheritancePattern = options.inheritancePattern;
    this.treeType = options.tableTree ? options.tableTree.type : undefined;
    this.parentClosureEntityMetadata = options.parentClosureEntityMetadata!;
    this.tableMetadataArgs = options.args;
    this.target = this.tableMetadataArgs.target;
    this.tableType = this.tableMetadataArgs.type;
  }
}
