import { LoggerOptions, LoggerType } from "../../logger/Logger";

/**
 * BaseConnectionOptions is set of connection options shared by all database types.
 */
export interface IBaseConnectionOptions {
  /**
   * Database type. This value is required.
   */
  readonly type: DatabaseType;

  /**
   * Connection name. If connection name is not given then it will be called "default".
   * Different connections must have different names.
   */
  readonly name?: string;

  /**
   * Entities to be loaded for this connection.
   * Accepts both entity classes and directories where from entities need to be loaded.
   * Directories support glob patterns.
   */
  readonly entities?: (Function | string)[];

  /**
   * Migrations to be loaded for this connection.
   * Accepts both migration classes and directories where from migrations need to be loaded.
   * Directories support glob patterns.
   */
  readonly migrations?: (Function | string)[];

  /**
   * Logging options.
   */
  readonly logOptions?: LoggerOptions;

  /**
   * Logger instance used to log queries and events in the ORM.
   */
  readonly loggerType?: LoggerType;

  /**
   * Maximum number of milliseconds query should be executed before logger log a warning.
   */
  readonly maxQueryExecutionTime?: number;

  /**
   * Indicates if database schema should be auto created on every application launch.
   * Be careful with this option and don't use this in production - otherwise you can lose production data.
   * This option is useful during debug and development.
   * Alternative to it, you can use CLI and run schema:sync command.
   *
   * Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
   * Instead, it syncs just by creating indices.
   */
  readonly synchronize?: boolean;

  /**
   * Indicates if migrations should be auto run on every application launch.
   * Alternative to it, you can use CLI and run migrations:run command.
   */
  readonly migrationsRun?: boolean;

  /**
   * Drops the schema each time connection is being established.
   * Be careful with this option and don't use this in production - otherwise you'll lose all production data.
   * This option is useful during debug and development.
   */
  readonly dropSchema?: boolean;

  /**
   * Prefix to use on all tables (collections) of this connection in the database.
   */
  readonly entityPrefix?: string;

  /**
   * Allows to setup cache options.
   */
  readonly cache?: CacheOption;

  /**
   * CLI settings.
   */
  readonly cli?: {
    /**
     * Directory where entities should be created by default.
     */
    readonly entitiesDir?: string;

    /**
     * Directory where migrations should be created by default.
     */
    readonly migrationsDir?: string;

    /**
     * Directory where subscribers should be created by default.
     */
    readonly subscribersDir?: string;
  };
}

/**
 * Database type.
 */
type DatabaseType = "mysql" | "postgres" | "mariadb" | "sqlite" | "sqljs" | "mongodb";

type CacheOption =
  | boolean
  | {
      /**
       * Type of caching.
       * // TODO: add mongodb and other cache providers as well in the future
       * - "database" means cached values will be stored in the separate table in database. This is default value.
       * - "redis" means cached values will be stored inside redis. You must provide redis connection options.
       */
      readonly type?: "database" | "redis";

      /**
       * Used to provide redis connection options.
       */
      readonly options?: any;

      /**
       * If set to true then queries (using find methods and QueryBuilder's methods) will always be cached.
       */
      readonly alwaysEnabled?: boolean;

      /**
       * Time in milliseconds in which cache will expire.
       * This can be setup per-query.
       * Default value is 1000 which is equivalent to 1 second.
       */
      readonly duration?: number;
    };
