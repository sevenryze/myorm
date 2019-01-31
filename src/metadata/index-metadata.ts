import { IEntityClassConstructor } from "./interface";

/**
 * Index metadata contains all information about table's index.
 */
export class IndexMetadata {
  public readonly target: IEntityClassConstructor;

  constructor(options: { target: IEntityClassConstructor }) {
    const { target } = options;

    this.target = target;
  }
}
