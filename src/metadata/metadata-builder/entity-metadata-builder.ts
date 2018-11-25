/**
 * Builds EntityMetadata objects and all its sub-metadatas.
 */
export class EntityMetadataBuilder {
  /**
   * Gets given's entity all inherited classes.
   * Gives in order from parents to children.
   * For example Post extends ContentModel which extends Unit it will give
   * [Unit, ContentModel, Post]
   */
  public static getInheritanceList(entity: Function): Function[] {
    const tree: Function[] = [entity];
    const getPrototypeOf = (object: Function): void => {
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
