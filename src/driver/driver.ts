import { IQueryRunner } from "../query-runner/query-runner";

/**
 * Driver organizes myorm communication with specific database management system.
 */
export interface IDriver {
  /**
   * Performs connection to the database.
   * Depend on driver type it may create a connection pool.
   */
  connect(): Promise<void>;

  /**
   * Closes connection with database and releases all resources.
   */
  disconnect(): Promise<void>;

  createQueryRunner(isTransaction?: boolean): Promise<IQueryRunner>;
}
