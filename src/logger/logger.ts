/**
 * Performs logging of the events in MyORM.
 */
export interface ILogger {
  /**
   * Logs query and parameters used in it.
   */
  logQuery(query: string, parameters?: any[]): any;

  /**
   * Logs query that is failed.
   */
  logQueryError(error: string, query: string, parameters?: any[]): any;

  /**
   * Logs query that is slow.
   */
  logQuerySlow(time: number, query: string, parameters?: any[]): any;

  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string): any;
}
