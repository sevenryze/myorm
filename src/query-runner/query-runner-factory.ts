import { PoolQueryRunner } from "./implements/pool-query-runner";
import { TransactionQueryRunner } from "./implements/transaction-query-runner";

export function queryRunnerFactory(queryIssuer: any, isTransaction?: boolean) {
  if (isTransaction) {
    return new TransactionQueryRunner(queryIssuer);
  } else {
    return new PoolQueryRunner(queryIssuer);
  }
}
