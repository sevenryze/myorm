import { IQueryRunner } from "../../src";
import { User } from "../entity/user";

export class UserRepository {
  public findById(id: string): Promise<User> {
    return this.queryRunner.query(``, []);
  }
  public update(entity: User): Promise<User> {
    throw new Error("Method not implemented.");
  }
  public save(entity: User): Promise<User> {
    throw new Error("Method not implemented.");
  }
  public deleteById(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  constructor(private queryRunner: IQueryRunner) {}
}
