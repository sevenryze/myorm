import { ConsoleLogger } from "./concrete/console-logger";
import { ILogger, LoggerOptions, LoggerType } from "./logger";

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
