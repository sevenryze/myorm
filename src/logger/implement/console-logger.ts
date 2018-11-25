import { ILogger } from "../logger";
import { LoggerOptions } from "../logger-factory";
import { BaseLogger } from "./base-logger";

/**
 * Performs logging of the events.
 * This version of logger uses console to log events and use syntax highlighting.
 */
export class ConsoleLogger extends BaseLogger implements ILogger {
  /**
   * Logs query and parameters used in it.
   */
  public logQuery = (query: string, parameters?: any[]) => {
    if (
      this.options === "all" ||
      this.options === true ||
      (Array.isArray(this.options) && !this.options.includes("query"))
    ) {
      const sql =
        query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");

      console.log("query:", sql);
    }
  };

  /**
   * Logs query that is failed.
   */
  public logQueryError = (error: string, query: string, parameters?: any[]) => {
    if (
      this.options === "all" ||
      this.options === true ||
      (Array.isArray(this.options) && !this.options.includes("error"))
    ) {
      const sql =
        query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");

      console.error(`query failed:`, sql);
      console.error(`error:`, error);
    }
  };

  /**
   * Logs query that is slow.
   */
  public logQuerySlow = (time: number, query: string, parameters?: any[]) => {
    const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");

    console.warn(`query is slow:`, sql);
    console.warn(`execution time:`, time);
  };

  /**
   * Logs events from the migration run process.
   */
  public logMigration = (message: string) => {
    console.log(message);
  };

  constructor(private options?: LoggerOptions) {
    super();
  }
}
