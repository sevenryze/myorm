import { ColumnMetadata } from "./column-metadata";
import { IndexMetadata } from "./index-metadata";
import { IEntityClassConstructor } from "./interface";
import { UniqueMetadata } from "./unique-metadata";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {
  public readonly columns: ColumnMetadata[] = [];
  public readonly indices: IndexMetadata[] = [];
  public readonly uniques: UniqueMetadata[] = [];

  public readonly target: IEntityClassConstructor;

  constructor(options: { target: IEntityClassConstructor }) {
    const { target } = options;

    this.target = target;
  }
}
