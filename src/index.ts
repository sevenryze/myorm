import { defaultConnectionManager } from "./connection/connection-manager";
import { IQueryRunner } from "./query-runner/query-runner";
export * from "./decorator/column-decorator";
export * from "./decorator/entity-decorator";
export * from "./decorator/index-decorator";
export * from "./decorator/primary-colunm-decorator";
export * from "./decorator/unique-decorator";
export * from "./migration/migration";
export { IQueryRunner } from "./query-runner/query-runner";

export function getTransactionQueryRunner(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName).getTransactionQueryRunner();
}

export function getQueryRunner(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName).getQueryRunner();
}

export function getConnection(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName);
}

interface IRepositoryConstructor<T> {
  new (queryRunner: IQueryRunner): T;
}
export async function prepareRepository<T>(
  repository: IRepositoryConstructor<T>,
  queryRunnerOrConnectionName?: IQueryRunner | string
): Promise<T> {
  // Check if using pooled query runner.
  if (!queryRunnerOrConnectionName || typeof queryRunnerOrConnectionName === "string") {
    const connectionName = queryRunnerOrConnectionName;
    return new repository(await getQueryRunner(connectionName));
  }

  const queryRunner = queryRunnerOrConnectionName;
  return new repository(queryRunner);
}
