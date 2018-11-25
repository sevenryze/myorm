import { IQueryCache } from "../cache/query-cache";
import { queryCacheFactory } from "../cache/query-cache-factory";
import { IDriver } from "../driver/driver";
import { driverFactory } from "../driver/driver-factory";
import { ILogger } from "../logger/Logger";
import { loggerFactory } from "../logger/logger-factory";
import { IMigration } from "../migration/migration";
import { IMongoConnectionOptions } from "./option/mongodb-options";
import { IMysqlConnectionOptions } from "./option/mysql-options";

/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export type IConnectionOptions = IMysqlConnectionOptions | IMongoConnectionOptions;

/**
 * Pool is a single database ORM connection pool to a specific database.
 *
 * You can have multiple `Pools` to multiple databases in your application.
 */
export class Connection {
  /**
   * Pool name.
   */
  public readonly name: string;

  /**
   * Pool options.
   */
  public readonly options: IConnectionOptions;

  /**
   * Database driver used by this Pool.
   */
  public readonly driver: IDriver;

  /**
   * Logger used to log orm events.
   */
  public readonly logger: ILogger;

  /**
   * Migration instances that are registered for this Pool.
   */
  public readonly migrations: IMigration[] = [];

  /**
   * Used to work with query result cache.
   */
  public readonly queryResultCache?: IQueryCache;

  get isConnected() {
    return this.isDriverConnected;
  }

  /**
   * Performs Pool to the database.
   * This method should be called once on application bootstrap.
   * This method not necessarily creates database Pool (depend on database type),
   * but it also can setup a Pool pool with database to use.
   */
  public async open(): Promise<this> {
    if (this.isDriverConnected) {
      throw new Error(this.name);
    }

    // connect to the database via its driver
    await this.driver.connect();

    // connect to the cache-specific database if cache is enabled
    if (this.queryResultCache) {
      await this.queryResultCache.connect();
    }

    // set connected status for the current Pool
    this.isDriverConnected = true;

    return this;
  }

  /**
   * Closes Pool with the database.
   * Once Pool is closed, you cannot use repositories or perform any operations except opening Pool again.
   */
  public async close(): Promise<void> {
    if (!this.isDriverConnected) {
      throw new Error(this.name);
    }

    await this.driver.disconnect();

    // disconnect from the cache-specific database if cache was enabled
    if (this.queryResultCache) {
      await this.queryResultCache.disconnect();
    }

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
    this.queryResultCache = options.cache ? queryCacheFactory(undefined) : undefined;
  }

  /**
   * Indicates if Pool is initialized or not.
   */
  private isDriverConnected = false;
}
