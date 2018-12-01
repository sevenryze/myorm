import { IEntityClassConstructor } from "../decorator/decorator-manager";
import { IDriver } from "../driver/driver";
import { driverFactory } from "../driver/driver-factory";
import { IMongoDriverOptions } from "../driver/implement/mongo-driver";
import { IMysqlDriverOptions } from "../driver/implement/mysql-driver";
import { ILogger } from "../logger/Logger";
import { loggerFactory, LoggerOptions, LoggerType } from "../logger/logger-factory";
import { IMigration } from "../migration/migration";

export interface IConnectionOptions {
  readonly driver: IMysqlDriverOptions | IMongoDriverOptions;

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
  readonly entities?: IEntityClassConstructor[];

  /**
   * Migrations to be loaded for this connection.
   * Accepts both migration classes and directories where from migrations need to be loaded.
   * Directories support glob patterns.
   */
  readonly migrations?: IMigration[];

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
 * Connection is a single database ORM connection to a specific database.
 *
 * **Note:** The Connection may holds a pool of underlay connection.
 *
 * You can have multiple `Connections` to multiple databases in your application.
 */
export class Connection {
  /**
   * Connection name.
   */
  public readonly name: string;

  /**
   * Connection options.
   */
  public readonly options: IConnectionOptions;

  /**
   * Database driver used by this Connection.
   */
  public readonly driver: IDriver;

  /**
   * Logger used to log orm events.
   */
  public readonly logger: ILogger;

  /**
   * Migration instances that are registered for this Connection.
   */
  public readonly migrations: IMigration[] = [];

  get isConnected() {
    return this.isDriverConnected;
  }

  /**
   * Performs Connection to the database.
   * This method should be called once on application bootstrap.
   * This method not necessarily creates database Connection (depend on database type),
   * but it also can setup a Connection Connection with database to use.
   */
  public async open(): Promise<this> {
    if (this.isDriverConnected) {
      throw new Error(this.name);
    }

    // connect to the database via its driver
    await this.driver.connect();

    // set connected status for the current Connection
    this.isDriverConnected = true;

    return this;
  }

  /**
   * Closes Connection with the database.
   * Once Connection is closed, you cannot use repositories or perform any operations except opening Connection again.
   */
  public async close(): Promise<void> {
    if (!this.isDriverConnected) {
      throw new Error(this.name);
    }

    await this.driver.disconnect();

    this.isDriverConnected = false;
  }

  public getQueryRunner() {
    return this.driver.createQueryRunner();
  }

  public getTransactionQueryRunner() {
    return this.driver.createQueryRunner(true);
  }

  constructor(options: IConnectionOptions) {
    this.name = options.name || "default";
    this.options = options;

    this.logger = loggerFactory(this.options.loggerType, this.options.logOptions);

    this.driver = driverFactory({
      type: "mysql",
    });
  }

  /**
   * Indicates if Connection is initialized or not.
   */
  private isDriverConnected = false;
}
