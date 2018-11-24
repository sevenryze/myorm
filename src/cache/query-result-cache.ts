import { QueryRunner } from "../query-runner/QueryRunner";
import { IQueryResultCacheOptions } from "./query-result-cache-options";

/**
 * Implementations of this interface provide different strategies to cache query builder results.
 */
export interface IQueryResultCache {
  /**
   * Creates a connection with given cache provider.
   */
  connect(): Promise<void>;

  /**
   * Closes a connection with given cache provider.
   */
  disconnect(): Promise<void>;

  /**
   * Performs operations needs to be created during schema synchronization.
   */
  synchronize(queryRunner?: QueryRunner): Promise<void>;

  /**
   * Caches given query result.
   */
  getFromCache(
    options: IQueryResultCacheOptions,
    queryRunner?: QueryRunner
  ): Promise<IQueryResultCacheOptions | undefined>;

  /**
   * Stores given query result in the cache.
   */
  storeInCache(
    options: IQueryResultCacheOptions,
    savedCache: IQueryResultCacheOptions | undefined,
    queryRunner?: QueryRunner
  ): Promise<void>;

  /**
   * Checks if cache is expired or not.
   */
  isExpired(savedCache: IQueryResultCacheOptions): boolean;

  /**
   * Clears everything stored in the cache.
   */
  clear(queryRunner?: QueryRunner): Promise<void>;

  /**
   * Removes all cached results by given identifiers from cache.
   */
  remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void>;
}
