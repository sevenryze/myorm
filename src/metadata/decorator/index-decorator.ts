import { IndexMetadata } from "../index-metadata";
import { IEntityClassConstructor } from "../interface";
import { defaultMetadataManager } from "../metadata-manager";

/**
 * Arguments for IndexMetadata class.
 */
export interface IIndexOptions {
  /**
   * Index name.
   */
  name?: string;

  /**
   * Columns combination to be used as index.
   */
  columns?: ((object?: any) => any[] | { [key: string]: number }) | string[];

  /**
   * Indicates if index must be unique or not.
   */
  unique?: boolean;

  /**
   * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
   * Works only in MySQL.
   */
  spatial?: boolean;

  /**
   * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
   * Works only in MySQL.
   */
  fulltext?: boolean;

  /**
   * Index filter condition.
   */
  where?: string;

  /**
   * Indicates if index must sync with database index.
   */
  synchronize?: boolean;

  /**
   * If true, the index only references documents with the specified field.
   * These indexes use less space but behave differently in some situations (particularly sorts).
   * This option is only supported for mongodb database.
   */
  sparse?: boolean;
}

/**
 * Creates a database index.
 *
 * Can **ONLY** be used on entity.
 *
 * Can create indices with composite columns when used.
 */
export function Index(options: IIndexOptions) {
  return (targetConstructor: IEntityClassConstructor) => {
    defaultMetadataManager.indices.push(new IndexMetadata());
  };
}
