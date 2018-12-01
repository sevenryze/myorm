import { IDriver } from "./Driver";
import { IMongoDriverOptions, MongoDriver } from "./implement/mongo-driver";
import { IMysqlDriverOptions, MysqlDriver } from "./implement/mysql-driver";

export type DriverType = "mysql" | "mongodb";

/**
 * Creates a new driver depend on a given connection's driver type.
 */
export function driverFactory(options: IMongoDriverOptions | IMysqlDriverOptions): IDriver {
  switch (options.type) {
    case "mysql":
      return new MysqlDriver(options);

    case "mongodb":
      return new MongoDriver(options);

    default:
      throw new Error();
  }
}
