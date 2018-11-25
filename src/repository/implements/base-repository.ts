import { IQueryRunner } from "../../query-runner/query-runner";
import { IRepository } from "../repository";

export abstract class BaseRepository<T> implements IRepository<T> {
  public update(entity: T) {
    return this.queryRunner.query(``, []);
  }
  public save(entity: T): Promise<T> {
    return this.queryRunner.query(``, []);
  }
  public deleteById(id: string): Promise<void> {
    return this.queryRunner.query(``, []);
  }
  public async findById(id: string) {
    return this.queryRunner.query(``, []);
  }

  constructor(private queryRunner: IQueryRunner) {}
}
