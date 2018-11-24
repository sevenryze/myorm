import { QueryRunner } from "../query-runner/QueryRunner";

/**
 * Migrations should implement this interface and all its methods.
 */
export interface IMigration {
  /**
   * Run the migrations.
   */
  up(queryRunner: QueryRunner): Promise<void>;

  /**
   * Reverse the migrations.
   */
  down(queryRunner: QueryRunner): Promise<void>;
}
