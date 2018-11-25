import { IQueryRunner } from "../query-runner";
import { BaseQueryRunner } from "./base-query-runner";

export class PoolQueryRunner extends BaseQueryRunner implements IQueryRunner {
  public async startTransaction(isolationLevel: string) {
    throw new Error(``);
  }
  public async commitTransaction() {
    throw new Error(``);
  }
  public async rollbackTransaction() {
    throw new Error(``);
  }

  constructor(queryIssuer: any) {
    super(queryIssuer);
  }
}
