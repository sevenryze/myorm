import { ConsoleLogger } from "./implement/console-logger";
import { ILogger } from "./logger";

/**
 * Logger type.
 */
export type LoggerType = "advanced-console" | "simple-console" | "file" | "debug" | ILogger;

type LoggerLevel = "query" | "schema" | "error" | "warn" | "info" | "log" | "migration";

/**
 * Logging options.
 */
export type LoggerOptions = boolean | "all" | LoggerLevel[];

export function loggerFactory(logger?: LoggerType, options?: LoggerOptions): ILogger {
  if (logger instanceof Object) {
    return logger as ILogger;
  }

  if (logger) {
    switch (logger) {
      case "simple-console":
        throw new Error(`Not implement!`);

      case "file":
        throw new Error(`Not implement!`);

      case "advanced-console":
        throw new Error(`Not implement!`);

      case "debug":
        throw new Error(`Not implement!`);
    }
  }

  return new ConsoleLogger(options);
}
