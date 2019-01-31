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
