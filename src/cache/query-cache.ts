import { Connection } from "../connection/connection";
import { IQueryCacheOptions } from "./query-cache-options";

/**
 * Implementations of this interface provide different strategies to cache query builder results.
 */
export interface IQueryCache {
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
  synchronize(pool?: Connection): Promise<void>;

  /**
   * Caches given query result.
   */
  getFromCache(options: IQueryCacheOptions, queryRunner?: Connection): Promise<IQueryCacheOptions | undefined>;

  /**
   * Stores given query result in the cache.
   */
  storeInCache(
    options: IQueryCacheOptions,
    savedCache: IQueryCacheOptions | undefined,
    queryRunner?: Connection
  ): Promise<void>;

  /**
   * Checks if cache is expired or not.
   */
  isExpired(savedCache: IQueryCacheOptions): boolean;

  /**
   * Clears everything stored in the cache.
   */
  clear(queryRunner?: Connection): Promise<void>;

  /**
   * Removes all cached results by given identifiers from cache.
   */
  remove(identifiers: string[], queryRunner?: Connection): Promise<void>;
}
