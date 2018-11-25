import { Connection, IConnectionOptions } from "./connection";

/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export class ConnectionManager {
  /**
   * List of connections registered in this connection manager.
   */
  public readonly connections: Connection[] = [];

  /**
   * Checks if connection with the given name exist in the manager.
   */
  public has(name: string): boolean {
    return !!this.connections.find(connection => connection.name === name);
  }

  /**
   * Gets registered connection with the given name.
   * If connection name is not given then it will get a default connection.
   * Throws error if connection with the given name was not found.
   */
  public get(name: string = "default"): Connection {
    const connection = this.connections.find(conn => conn.name === name);
    if (!connection) {
      throw new Error(name);
    }

    return connection;
  }

  /**
   * Creates a new connection based on the given connection options and registers it in the manager.
   * Connection won't be established, you'll need to manually call connect method to establish connection.
   */
  public create(options: IConnectionOptions): Connection {
    // check if such connection is already registered
    const existConnection = this.connections.find(conn => conn.name === (options.name || "default"));
    if (existConnection) {
      // if connection is registered and its not closed then throw an error
      if (existConnection.isConnected) {
        throw new Error(options.name || "default");
      }

      // if its registered but closed then simply remove it from the manager
      this.connections.splice(this.connections.indexOf(existConnection), 1);
    }

    // create a new connection
    const connection = new Connection(options);
    this.connections.push(connection);
    return connection;
  }
}

export const defaultConnectionManager = new ConnectionManager();
