import { IQueryRunner } from "../../query-runner/query-runner";
import { IDriver } from "../Driver";

export interface IMongoDriverOptions {
  type: "mongodb";
}

export class MongoDriver implements IDriver {
  public connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public createQueryRunner(isTransaction?: boolean | undefined): Promise<IQueryRunner> {
    throw new Error("Method not implemented.");
  }

  constructor(private options: IMongoDriverOptions) {}
}
