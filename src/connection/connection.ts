import { EntitySchema, PromiseUtils } from "..";
import { IQueryResultCache } from "../cache/query-result-cache";
import { queryResultCacheFactory } from "../cache/query-result-cache-factory";
import { ObjectType } from "../common/ObjectType";
import { Driver } from "../driver/Driver";
import { DriverFactory } from "../driver/DriverFactory";
import { MysqlDriver } from "../driver/mysql/MysqlDriver";
import { SqlServerDriver } from "../driver/sqlserver/SqlServerDriver";
import { EntityManager } from "../entity-manager/EntityManager";
import { EntityManagerFactory } from "../entity-manager/EntityManagerFactory";
import { MongoEntityManager } from "../entity-manager/MongoEntityManager";
import { SqljsEntityManager } from "../entity-manager/SqljsEntityManager";
import { CannotExecuteNotConnectedError } from "../error/CannotExecuteNotConnectedError";
import { EntityMetadataNotFoundError } from "../error/EntityMetadataNotFoundError";
import { QueryRunnerProviderAlreadyReleasedError } from "../error/QueryRunnerProviderAlreadyReleasedError";
import { ILogger } from "../logger/Logger";
import { loggerFactory } from "../logger/logger-factory";
import { EntityMetadataValidator } from "../metadata-builder/EntityMetadataValidator";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { IMigration } from "../migration/migration";
import { MigrationExecutor } from "../migration/MigrationExecutor";
import { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder";
import { QueryRunner } from "../query-runner/QueryRunner";
import { Repository } from "../repository/Repository";
import { ObjectUtils } from "../util/ObjectUtils";
import { IConnectionOptions } from "./connection-options";
import { ConnectionMetadataBuilder } from "./ConnectionMetadataBuilder";

/**
 * Connection is a single database ORM connection to a specific database.
 *
 * Its **not required to be a database connection**, depend on database type it can create connection pool.
 *
 * You can have multiple connections to multiple databases in your application.
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
   * Database driver used by this connection.
   */
  public readonly driver: Driver;

  /**
   * EntityManager of this connection.
   */
  public readonly manager: EntityManager;

  /**
   * Logger used to log orm events.
   */
  public readonly logger: ILogger;

  /**
   * Migration instances that are registered for this connection.
   */
  public readonly migrations: IMigration[] = [];

  /**
   * All entity metadatas that are registered for this connection.
   */
  public readonly entityMetadatas: EntityMetadata[] = [];

  /**
   * Used to work with query result cache.
   */
  public readonly queryResultCache?: IQueryResultCache;

  /**
   * Gets the mongodb entity manager that allows to perform mongodb-specific repository operations
   * with any entity in this connection.
   *
   * Available only in mongodb connections.
   */
  get mongoManager(): MongoEntityManager {
    if (!(this.manager instanceof MongoEntityManager))
      throw new Error(`MongoEntityManager is only available for MongoDB databases.`);

    return this.manager as MongoEntityManager;
  }

  /**
   * Gets a sql.js specific Entity Manager that allows to perform special load and save operations
   *
   * Available only in connection with the sqljs driver.
   */
  get sqljsManager(): SqljsEntityManager {
    if (!(this.manager instanceof SqljsEntityManager))
      throw new Error(`SqljsEntityManager is only available for Sqljs databases.`);

    return this.manager as SqljsEntityManager;
  }

  get isConnected() {
    return this.isCurrentConnected;
  }

  /**
   * Performs connection to the database.
   * This method should be called once on application bootstrap.
   * This method not necessarily creates database connection (depend on database type),
   * but it also can setup a connection pool with database to use.
   */
  public async connect(): Promise<this> {
    if (this.isCurrentConnected) {
      throw new Error(this.name);
    }

    // connect to the database via its driver
    await this.driver.connect();

    // connect to the cache-specific database if cache is enabled
    if (this.queryResultCache) {
      await this.queryResultCache.connect();
    }

    // set connected status for the current connection
    this.isCurrentConnected = true;

    try {
      // build all metadatas registered in the current connection
      this.buildMetadatas();

      await this.driver.afterConnect();

      // if option is set - drop schema once connection is done
      if (this.options.dropSchema) {
        await this.dropDatabase();
      }

      // if option is set - automatically synchronize a schema
      if (this.options.synchronize) {
        await this.synchronize();
      }

      // if option is set - automatically synchronize a schema
      if (this.options.migrationsRun) {
        await this.runMigrations();
      }
    } catch (error) {
      // if for some reason build metadata fail (for example validation error during entity metadata check)
      // connection needs to be closed
      await this.close();
      throw error;
    }

    return this;
  }

  /**
   * Closes connection with the database.
   * Once connection is closed, you cannot use repositories or perform any operations except opening connection again.
   */
  public async close(): Promise<void> {
    if (!this.isCurrentConnected) {
      throw new Error(this.name);
    }

    await this.driver.disconnect();

    // disconnect from the cache-specific database if cache was enabled
    if (this.queryResultCache) {
      await this.queryResultCache.disconnect();
    }

    this.isCurrentConnected = false;
  }

  /**
   * Creates database schema for all entities registered in this connection.
   * Can be used only after connection to the database is established.
   *
   * @param dropBeforeSync If set to true then it drops the database with all its tables and data
   */
  public async synchronize(dropBeforeSync: boolean = false): Promise<void> {
    if (!this.isCurrentConnected) {
      throw new Error(this.name);
    }

    if (dropBeforeSync) {
      await this.dropDatabase();
    }

    const schemaBuilder = this.driver.createSchemaBuilder();
    await schemaBuilder.build();
  }

  /**
   * Drops the database and all its data.
   * Be careful with this method on production since this method will erase all your database tables and their data.
   * Can be used only after connection to the database is established.
   */
  // TODO rename
  public async dropDatabase(): Promise<void> {
    const queryRunner = await this.createQueryRunner("master");
    if (this.driver instanceof SqlServerDriver || this.driver instanceof MysqlDriver) {
      const databases: string[] = this.driver.database ? [this.driver.database] : [];
      this.entityMetadatas.forEach(metadata => {
        if (metadata.database && databases.indexOf(metadata.database) === -1) {
          databases.push(metadata.database);
        }
      });
      await PromiseUtils.runInSequence(databases, database => queryRunner.clearDatabase(database));
    } else {
      await queryRunner.clearDatabase();
    }
    await queryRunner.release();
  }

  /**
   * Runs all pending migrations.
   * Can be used only after connection to the database is established.
   */
  public async runMigrations(options?: { transaction?: boolean }): Promise<void> {
    if (!this.isCurrentConnected) {
      throw new CannotExecuteNotConnectedError(this.name);
    }

    const migrationExecutor = new MigrationExecutor(this);
    if (options && options.transaction === false) {
      migrationExecutor.transaction = false;
    }
    await migrationExecutor.executePendingMigrations();
  }

  /**
   * Reverts last executed migration.
   * Can be used only after connection to the database is established.
   */
  public async undoLastMigration(options?: { transaction?: boolean }): Promise<void> {
    if (!this.isCurrentConnected) {
      throw new CannotExecuteNotConnectedError(this.name);
    }

    const migrationExecutor = new MigrationExecutor(this);
    if (options && options.transaction === false) {
      migrationExecutor.transaction = false;
    }
    await migrationExecutor.undoLastMigration();
  }

  /**
   * Checks if entity metadata exist for the given entity class, target name or table name.
   */
  public hasMetadata(target: Function | EntitySchema<any> | string): boolean {
    return !!this.findMetadata(target);
  }

  /**
   * Gets entity metadata for the given entity class or schema name.
   */
  public getMetadata(target: Function | EntitySchema<any> | string): EntityMetadata {
    const metadata = this.findMetadata(target);
    if (!metadata) {
      throw new EntityMetadataNotFoundError(target);
    }

    return metadata;
  }

  /**
   * Gets repository for the given entity.
   */
  public getRepository<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string): Repository<Entity> {
    return this.manager.getRepository(target);
  }

  /**
   * Gets custom entity repository marked with @EntityRepository decorator.
   */
  public getCustomRepository<T>(customRepository: ObjectType<T>): T {
    return this.manager.getCustomRepository(customRepository);
  }

  /**
   * Wraps given function execution (and all operations made there) into a transaction.
   * All database operations must be executed using provided entity manager.
   */
  public async transaction(runInTransaction: (entityManager: EntityManager) => Promise<any>): Promise<any> {
    return this.manager.transaction(runInTransaction);
  }

  /**
   * Executes raw SQL query and returns raw database results.
   */
  public async query(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any> {
    if (this instanceof MongoEntityManager) {
      throw new Error(`Queries aren't supported by MongoDB.`);
    }

    if (queryRunner && queryRunner.isReleased) throw new QueryRunnerProviderAlreadyReleasedError();

    const usedQueryRunner = queryRunner || this.createQueryRunner("master");

    try {
      return await usedQueryRunner.query(query, parameters); // await is needed here because we are using finally
    } finally {
      if (!queryRunner) await usedQueryRunner.release();
    }
  }

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  public createQueryBuilder<Entity>(
    entityClass: ObjectType<Entity> | EntitySchema<Entity> | Function | string,
    alias: string,
    queryRunner?: QueryRunner
  ): SelectQueryBuilder<Entity>;

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  public createQueryBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any>;

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  public createQueryBuilder<Entity>(
    entityOrRunner?: ObjectType<Entity> | EntitySchema<Entity> | Function | string | QueryRunner,
    alias?: string,
    queryRunner?: QueryRunner
  ): SelectQueryBuilder<Entity> {
    if (this instanceof MongoEntityManager) throw new Error(`Query Builder is not supported by MongoDB.`);

    if (alias) {
      const metadata = this.getMetadata(entityOrRunner as Function | EntitySchema<Entity> | string);
      return new SelectQueryBuilder(this, queryRunner).select(alias).from(metadata.target, alias);
    } else {
      return new SelectQueryBuilder(this, entityOrRunner as QueryRunner | undefined);
    }
  }

  /**
   * Creates a query runner used for perform queries on a single database connection.
   * Using query runners you can control your queries to execute using single database connection and
   * manually control your database transaction.
   *
   * Mode is used in replication mode and indicates whatever you want to connect
   * to master database or any of slave databases.
   * If you perform writes you must use master database,
   * if you perform reads you can use slave databases.
   */
  public createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
    const queryRunner = this.driver.createQueryRunner(mode);
    const manager = this.createEntityManager(queryRunner);
    Object.assign(queryRunner, { manager: manager });
    return queryRunner;
  }

  /**
   * Creates an Entity Manager for the current connection with the help of the EntityManagerFactory.
   */
  public createEntityManager(queryRunner?: QueryRunner): EntityManager {
    return new EntityManagerFactory().create(this, queryRunner);
  }

  constructor(options: IConnectionOptions) {
    this.name = options.name || "default";
    this.options = options;

    this.logger = loggerFactory(this.options.loggerType, this.options.logOptions);

    this.driver = new DriverFactory().create(this);
    this.manager = this.createEntityManager();
    this.queryResultCache = options.cache ? queryResultCacheFactory(undefined) : undefined;
  }

  /**
   * Indicates if connection is initialized or not.
   */
  private isCurrentConnected = false;

  /**
   * Finds exist entity metadata by the given entity class, target name or table name.
   */
  private findMetadata(target: Function | EntitySchema<any> | string): EntityMetadata | undefined {
    return this.entityMetadatas.find(metadata => {
      if (metadata.target === target) {
        return true;
      }
      if (target instanceof EntitySchema) {
        return metadata.name === target.options.name;
      }
      if (typeof target === "string") {
        if (target.indexOf(".") !== -1) {
          return metadata.tablePath === target;
        } else {
          return metadata.name === target || metadata.tableName === target;
        }
      }

      return false;
    });
  }

  /**
   * Builds metadatas for all registered classes inside this connection.
   */
  private buildMetadatas(): void {
    const connectionMetadataBuilder = new ConnectionMetadataBuilder(this);
    const entityMetadataValidator = new EntityMetadataValidator();

    // build entity metadatas
    const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas(this.options.entities || []);
    ObjectUtils.assign(this, { entityMetadatas: entityMetadatas });

    // create migration instances
    const migrations = connectionMetadataBuilder.buildMigrations(this.options.migrations || []);
    ObjectUtils.assign(this, { migrations: migrations });

    // validate all created entity metadatas to make sure user created entities are valid and correct
    entityMetadataValidator.validateMany(this.entityMetadatas, this.driver);
  }
}
