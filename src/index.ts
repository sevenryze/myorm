import { defaultConnectionManager } from "./connection/connection-manager";
import { IQueryRunner } from "./query-runner/query-runner";
import { IRepositoryConstructor } from "./repository/repository";

export * from "./decorator/entity-decorator";
export * from "./decorator/column-decorator";
export * from "./decorator/index-decorator";
export * from "./decorator/primary-colunm-decorator";
export * from "./decorator/unique-decorator";

export * from "./migration/migration";

export * from "./repository/repository";
export * from "./repository/implements/base-repository";

export function getTransactionQueryRunner(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName).getTransactionQueryRunner();
}

export function getQueryRunner(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName).getQueryRunner();
}

export function getConnection(connectionName: string = "default") {
  return defaultConnectionManager.get(connectionName);
}

export async function prepareRepository<T extends IRepositoryConstructor<T>>(
  repository: T,
  queryRunnerOrConnectionName?: IQueryRunner | string
): Promise<T> {
  if (!queryRunnerOrConnectionName || typeof queryRunnerOrConnectionName === "string") {
    const connectionName = queryRunnerOrConnectionName;
    return new repository(await getQueryRunner(connectionName));
  }

  const queryRunner = queryRunnerOrConnectionName;
  return new repository(queryRunner);
}
