import { ColumnMetadata } from "./column-metadata";
import { EntityMetadata } from "./entity-metadata";
import { IndexMetadata } from "./index-metadata";
import { IEntityClassConstructor } from "./interface";
import { UniqueMetadata } from "./unique-metadata";

export class MetadataManager {
  public readonly entities: EntityMetadata[] = [];
  public readonly columns: ColumnMetadata[] = [];
  public readonly indices: IndexMetadata[] = [];
  public readonly uniques: UniqueMetadata[] = [];

  public build() {
    this.entities.forEach(entity => {
      const inheritanceList = this.getInheritanceList(entity.target);

      // Build unique constrains
      this.uniques.forEach(item => {
        if (inheritanceList.includes(item.target)) {
          entity.uniques.push(item);
        }
      });

      // Build columns.
      this.columns.forEach(item => {
        if (inheritanceList.includes(item.target)) {
          entity.columns.push(item);

          item.build({
            entityMetadata: entity,
          });
        }
      });

      // Build indices
      this.indices.forEach(item => {
        if (inheritanceList.includes(item.target)) {
          entity.indices.push(item);
        }
      });
    });
  }

  constructor() {}

  /**
   * Gets given's entity all inherited classes.
   * Gives in order from parents to children.
   * For example Post extends ContentModel which extends Unit it will give
   * [Unit, ContentModel, Post]
   */
  private getInheritanceList(entity: IEntityClassConstructor): IEntityClassConstructor[] {
    const tree: IEntityClassConstructor[] = [entity];
    const getPrototypeOf = (object: IEntityClassConstructor): void => {
      const proto = Object.getPrototypeOf(object);
      if (proto && proto.name) {
        tree.push(proto);
        getPrototypeOf(proto);
      }
    };
    getPrototypeOf(entity);
    return tree;
  }
}

export const defaultMetadataManager = new MetadataManager();
