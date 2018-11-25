import { IRepository } from "../../src";
import { User } from "../entity/user";

export class UserRepository implements IRepository<User> {
  public findById(id: string): Promise<User> {
    throw new Error("Method not implemented.");
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
}
