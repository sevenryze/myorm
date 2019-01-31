import { EntityMetadata } from "./entity-metadata";
import { IEntityClassConstructor } from "./interface";

/**
 * This metadata contains all information about entity's column.
 */
export class ColumnMetadata {
  public target: IEntityClassConstructor;
  
  /**
   * Class's property name on which this column is applied.
   */
  public propertyName: string;

  /**
   * Entity metadata where this column metadata is.
   *
   * For example for @Column() name: string in Post, entityMetadata will be metadata of Post entity.
   */
  public entityMetadata?: EntityMetadata;

  /**
   * The database type of the column.
   */
  public type: ColumnType;

  /**
   * Type's length in the database.
   */
  public length?: number;

  /**
   * Type's display width in the database.
   */
  public width?: number;

  /**
   * Defines column character set.
   */
  public charset?: string;

  /**
   * Defines column collation.
   */
  public collation?: string;

  /**
   * Indicates if this column is a primary key.
   */
  public isPrimary: boolean = false;

  /**
   * Indicates if column can contain nulls or not.
   */
  public isNullable: boolean = false;

  /**
   * Column comment.
   * This feature is not supported by all databases.
   */
  public comment?: string;

  /**
   * Default database value.
   */
  public default?: any;

  /**
   * Puts UNSIGNED attribute on to numeric column. Works only for MySQL.
   */
  public unsigned?: boolean;

  /**
   * Array of possible enumerated values.
   */
  public enum?: any[];

  /**
   * Gets full path to this column property (including column property name).
   * Full path is relevant when column is used in embeds (one or multiple nested).
   * For example it will return "counters.subcounters.likes".
   * If property is not in embeds then it returns just property name of the column.
   */
  public propertyPath: string;

  /**
   * Same as property path, but dots are replaced with '_'.
   * Used in query builder statements.
   */
  public propertyAliasName: string;

  /**
   * Gets full path to this column database name (including column database name).
   * Full path is relevant when column is used in embeds (one or multiple nested).
   * For example it will return "counters.subcounters.likes".
   * If property is not in embeds then it returns just database name of the column.
   */
  public databasePath: string;

  /**
   * Complete column name in the database including its embedded prefixes.
   */
  public databaseName: string;

  /**
   * Database name in the database without embedded prefixes applied.
   */
  public databaseNameWithoutPrefixes: string;

  public build(options: { entityMetadata: EntityMetadata }) {
    const { entityMetadata } = options;

    this.entityMetadata = entityMetadata;
  }

  constructor(options: { target: IEntityClassConstructor; propertyName: string }) {
    const { propertyName, target } = options;

    this.target = target;
    this.propertyName = propertyName;
  }
}

/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export type PrimaryGeneratedColumnType =
  | "int" // mysql, mssql, oracle, sqlite
  | "int2" // postgres, sqlite
  | "int2" // postgres, sqlite
  | "int4" // postgres
  | "int8" // postgres, sqlite
  | "integer" // postgres, oracle, sqlite
  | "tinyint" // mysql, mssql, sqlite
  | "smallint" // mysql, postgres, mssql, oracle, sqlite
  | "mediumint" // mysql, sqlite
  | "bigint" // mysql, postgres, mssql, sqlite
  | "dec" // oracle, mssql
  | "decimal" // mysql, postgres, mssql, sqlite
  | "numeric" // postgres, mssql, sqlite
  | "number"; // oracle

/**
 * Column types where spatial properties are used.
 */
export type SpatialColumnType =
  | "geometry" // postgres
  | "geography"; // postgres

/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType =
  | "float" // mysql, mssql, oracle, sqlite
  | "double" // mysql, sqlite
  | "dec" // oracle, mssql
  | "decimal" // mysql, postgres, mssql, sqlite
  | "numeric" // postgres, mssql, sqlite
  | "real" // mysql, postgres, mssql, oracle, sqlite
  | "double precision" // postgres, oracle, sqlite
  | "number" // oracle
  | "datetime" // mssql, mysql, sqlite
  | "datetime2" // mssql
  | "datetimeoffset" // mssql
  | "time" // mysql, postgres, mssql
  | "time with time zone" // postgres
  | "time without time zone" // postgres
  | "timestamp" // mysql, postgres, mssql, oracle
  | "timestamp without time zone" // postgres
  | "timestamp with time zone" // postgres, oracle
  | "timestamp with local time zone"; // oracle

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType =
  | "character varying" // postgres
  | "varying character" // sqlite
  | "nvarchar" // mssql
  | "character" // mysql, postgres, sqlite
  | "native character" // sqlite
  | "varchar" // mysql, postgres, mssql, sqlite
  | "char" // mysql, postgres, mssql, oracle
  | "nchar" // mssql, oracle, sqlite
  | "varchar2" // oracle
  | "nvarchar2" // oracle, sqlite
  | "raw" // oracle
  | "binary" // mssql
  | "varbinary"; // mssql

export type WithWidthColumnType =
  | "tinyint" // mysql
  | "smallint" // mysql
  | "mediumint" // mysql
  | "int" // mysql
  | "bigint"; // mysql

/**
 * All other regular column types.
 */
export type SimpleColumnType =
  | "simple-array" // typeorm-specific, automatically mapped to string
  // |"string" // typeorm-specific, automatically mapped to varchar depend on platform
  | "simple-json" // typeorm-specific, automatically mapped to string

  // numeric types
  | "bit" // mssql
  | "int2" // postgres, sqlite
  | "integer" // postgres, oracle, sqlite
  | "int4" // postgres
  | "int8" // postgres, sqlite
  | "unsigned big int" // sqlite
  | "float4" // postgres
  | "float8" // postgres
  | "smallmoney" // mssql
  | "money" // postgres, mssql

  // boolean types
  | "boolean" // postgres, sqlite
  | "bool" // postgres

  // text/binary types
  | "tinyblob" // mysql
  | "tinytext" // mysql
  | "mediumblob" // mysql
  | "mediumtext" // mysql
  | "blob" // mysql, oracle, sqlite
  | "text" // mysql, postgres, mssql, sqlite
  | "ntext" // mssql
  | "citext" // postgres
  | "hstore" // postgres
  | "longblob" // mysql
  | "longtext" // mysql
  | "bytea" // postgres
  | "long" // oracle
  | "raw" // oracle
  | "long raw" // oracle
  | "bfile" // oracle
  | "clob" // oracle, sqlite
  | "nclob" // oracle
  | "image" // mssql

  // date types
  | "timetz"
  | "timestamptz"
  | "timestamp with local time zone" // oracle
  | "smalldatetime" // mssql
  | "date" // mysql, postgres, mssql, oracle, sqlite
  | "interval year to month" // oracle
  | "interval day to second" // oracle
  | "interval" // postgres
  | "year" // mysql

  // geometric types
  | "point" // postgres, mysql
  | "line" // postgres
  | "lseg" // postgres
  | "box" // postgres
  | "circle" // postgres
  | "path" // postgres
  | "polygon" // postgres, mysql
  | "geography" // mssql
  | "geometry" // mysql
  | "linestring" // mysql
  | "multipoint" // mysql
  | "multilinestring" // mysql
  | "multipolygon" // mysql
  | "geometrycollection" // mysql

  // range types
  | "int4range" // postgres
  | "int8range" // postgres
  | "numrange" // postgres
  | "tsrange" // postgres
  | "tstzrange" // postgres
  | "daterange" // postgres

  // other types
  | "enum" // mysql, postgres
  | "cidr" // postgres
  | "inet" // postgres
  | "macaddr" // postgres
  | "bit" // postgres
  | "bit varying" // postgres
  | "varbit" // postgres
  | "tsvector" // postgres
  | "tsquery" // postgres
  | "uuid" // postgres
  | "xml" // mssql, postgres
  | "json" // mysql, postgres
  | "jsonb" // postgres
  | "varbinary" // mssql
  | "hierarchyid" // mssql
  | "sql_variant" // mssql
  | "rowid" // oracle
  | "urowid" // oracle
  | "uniqueidentifier" // mssql
  | "rowversion"; // mssql

/**
 * Any column type column can be.
 */
export type ColumnType =
  | WithPrecisionColumnType
  | WithLengthColumnType
  | WithWidthColumnType
  | SpatialColumnType
  | SimpleColumnType
  | BooleanConstructor
  | DateConstructor
  | NumberConstructor
  | StringConstructor;
