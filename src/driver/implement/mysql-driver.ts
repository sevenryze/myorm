import mysql from "mysql";
import { IQueryRunner } from "../../query-runner/query-runner";
import { queryRunnerFactory } from "../../query-runner/query-runner-factory";
import { IDriver } from "../driver";

export interface IMysqlDriverOptions extends mysql.PoolConfig {
  type: "mysql";
}

/**
 * Organizes communication with MySQL DBMS.
 */
export class MysqlDriver implements IDriver {
  public async createQueryRunner(isTransaction?: boolean): Promise<IQueryRunner> {
    const queryIssuer = isTransaction ? await this.getConnection() : this.pool;

    return queryRunnerFactory(queryIssuer, isTransaction);
  }

  /**
   * Performs connection to the database.
   */
  public async connect(): Promise<void> {
    await this.createPool(this.options);
  }

  /**
   * Closes connection with the database.
   */
  public disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.pool) {
        return resolve();
      }

      this.pool.end((err: any) => {
        if (err) {
          return reject(err);
        }
        this.pool = undefined;
        resolve();
      });
    });
  }

  constructor(private options: IMysqlDriverOptions) {}

  private pool?: mysql.Pool;

  /**
   * Creates a new connection pool for a given database credentials.
   */
  private createPool(options: mysql.PoolConfig): Promise<void> {
    // make sure connection is working fine
    return new Promise((resolve, reject) => {
      if (this.pool) {
        return resolve();
      }

      // create a connection pool
      const pool = mysql.createPool(options);

      // (issue #610) we make first connection to database to make sure if connection credentials are wrong
      // we give error before calling any other method that creates actual query runner
      pool.getConnection((err, connection) => {
        if (err) {
          return pool.end(() => reject(err));
        }

        connection.release();

        this.pool = pool;
        resolve();
      });
    });
  }

  private getConnection(): Promise<mysql.PoolConnection> {
    return new Promise((resolve, reject) => {
      if (!this.pool) {
        return reject(`Database connection pool does not exist.`);
      }

      this.pool.getConnection((error, connection) => {
        if (error) {
          reject(error);
        }

        resolve(connection);
      });
    });
  }
}
