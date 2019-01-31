import { IEntityClassConstructor } from "./interface";

/**
 * Unique metadata contains all information about table's unique constraints.
 */
export class UniqueMetadata {
  public readonly target: IEntityClassConstructor;

  constructor(options: { target: IEntityClassConstructor }) {
    const { target } = options;

    this.target = target;
  }
}
