export interface IQueryRunner {
  query(sqlString: string, values?: any[]): Promise<any>;

  startTransaction(isolationLevel?: string): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;
}
