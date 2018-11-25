export abstract class BaseQueryRunner {
  public query(sqlString: string, values?: any[]) {
    return this.queryIssuer.query(sqlString, values);
  }

  constructor(protected queryIssuer: any) {}
}
