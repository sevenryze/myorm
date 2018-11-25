import { defaultDecoratorManager, IEntityClassConstructor } from "./decorator-manager";

/**
 * Arguments for UniqueMetadata class.
 */
export interface IUniqueOptions {
  /**
   * Unique constraint name.
   */
  name?: string;

  /**
   * Columns combination to be unique.
   */
  columns?: ((object?: any) => any[] | { [key: string]: number }) | string[];
}

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(options: IUniqueOptions) {
  return (targetConstructor: IEntityClassConstructor) => {
    defaultDecoratorManager.uniques.push({
      options,
      target: targetConstructor,
    });
  };
}
