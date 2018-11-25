import { IColumnOptions } from "./column-decorator";
import { IEntityOptions } from "./entity-decorator";
import { IIndexOptions } from "./index-decorator";
import { IUniqueOptions } from "./unique-decorator";

/* export interface IEntityClassConstructor {
  new (...args: any[]): object;
}
 */

// tslint:disable-next-line
export type IEntityClassConstructor = Function;

export class DecoratorManager {
  public readonly tables: Array<{ target: IEntityClassConstructor; options: IEntityOptions }> = [];
  public readonly indices: Array<{ target: IEntityClassConstructor; options: IIndexOptions }> = [];
  public readonly uniques: Array<{ target: IEntityClassConstructor; options: IUniqueOptions }> = [];
  public readonly columns: Array<{
    target: IEntityClassConstructor;
    propertyName: string;
    options: IColumnOptions;
  }> = [];
}

export const defaultDecoratorManager = new DecoratorManager();
