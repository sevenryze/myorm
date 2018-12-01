import { IQueryRunner } from "../query-runner";
import { BaseQueryRunner } from "./base-query-runner";

export class TransactionQueryRunner extends BaseQueryRunner implements IQueryRunner {
  public async startTransaction(isolationLevel?: string) {
    await this.queryIssuer.query(isolationLevel);
  }
  public async commitTransaction() {
    await this.queryIssuer.query(`COMMIT`);
    await this.releaseConnection();
  }
  public async rollbackTransaction() {
    await this.queryIssuer.query(`ROLLBACK`);
    await this.releaseConnection();
  }

  constructor(queryIssuer: any) {
    super(queryIssuer);
  }

  private releaseConnection() {
    this.queryIssuer.release();
  }
}
