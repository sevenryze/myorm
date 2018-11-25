import { IColumnOptions } from "./column-decorator";

export interface IPrimaryColunmOptions extends IColumnOptions {
  /**
   * Indicates if this column is a primary key.
   * Same can be achieved when @PrimaryColumn decorator is used.
   */
  primary?: boolean;
}
