import { metadataConfigStorage } from "../..";

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(options: IColumnOptions) {
  return (targetProperty: object, propertyName: string) => {
    metadataConfigStorage.columns.push({
      mode: "regular",
      options,
      propertyName,
      target: targetProperty.constructor,
    });
  };
}
