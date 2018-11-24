import { importClassesFromDirectories } from "../util/DirectoryExportedClassesLoader";
import { OrmUtils } from "../util/OrmUtils";
import { getFromContainer } from "../container";
import { MigrationInterface } from "../migration/MigrationInterface";
import { getMetadataArgsStorage } from "../index";
import { EntityMetadataBuilder } from "../metadata-builder/EntityMetadataBuilder";
import { EntitySchemaTransformer } from "../entity-schema/EntitySchemaTransformer";
import { Connection } from "./Connection";
import { EntitySchema } from "../entity-schema/EntitySchema";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { EntitySubscriberInterface } from "../subscriber/EntitySubscriberInterface";

/**
 * Builds migration instances and entity metadatas for the given classes.
 */
export class ConnectionMetadataBuilder {
  /**
   * Builds migration instances for the given classes or directories.
   */
  buildMigrations(migrations: (Function | string)[]): MigrationInterface[] {
    const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
    const allMigrationClasses = [...migrationClasses, ...importClassesFromDirectories(migrationDirectories)];
    return allMigrationClasses.map(migrationClass => getFromContainer<MigrationInterface>(migrationClass));
  }

  /**
   * Builds entity metadatas for the given classes or directories.
   */
  buildEntityMetadatas(entities: (Function | EntitySchema<any> | string)[]): EntityMetadata[] {
    const decoratorEntityMetadatas = new EntityMetadataBuilder(this.connection, getMetadataArgsStorage()).build(
      allEntityClasses
    );

    return [...decoratorEntityMetadatas, ...schemaEntityMetadatas];
  }

  constructor(protected connection: Connection) {}
}
