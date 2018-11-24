import { IMongoConnectionOptions } from "./option/mongodb-options";
import { IMysqlConnectionOptions } from "./option/mysql-options";

/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export type IConnectionOptions = IMysqlConnectionOptions | IMongoConnectionOptions;
