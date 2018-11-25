import { IQueryRunner } from "../query-runner/query-runner";

export interface IRepository<T> {
  findById(id: string): Promise<T>;
  update(entity: T): Promise<T>;
  save(entity: T): Promise<T>;
  deleteById(id: string): Promise<void>;
}

export interface IRepositoryConstructor<T> {
  new (queryRunner: IQueryRunner): T;
}
