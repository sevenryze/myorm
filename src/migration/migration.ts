import { IQueryRunner } from "../query-runner/query-runner";

/**
 * Migrations should implement this interface and all its methods.
 */
export interface IMigration {
  /**
   * Run the migrations.
   */
  up(queryRunner: IQueryRunner): Promise<void>;

  /**
   * Reverse the migrations.
   */
  down(queryRunner: IQueryRunner): Promise<void>;
}
