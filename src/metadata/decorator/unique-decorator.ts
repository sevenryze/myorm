import { IEntityClassConstructor } from "../interface";
import { defaultMetadataManager } from "../metadata-manager";
import { UniqueMetadata } from "../unique-metadata";

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
    defaultMetadataManager.uniques.push(new UniqueMetadata());
  };
}
