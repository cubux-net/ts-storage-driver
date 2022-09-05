/**
 * Driver interface to read/write data by single item.
 */
export interface StoreDriverSingle<K, V> {
  /**
   * Get value of specific item with the given key.
   */
  getItem(key: K): Promise<V | undefined>;
  /**
   * Remove item with the given key.
   */
  removeItem(key: K): Promise<void>;
  /**
   * Store the given value in item with the given key.
   */
  setItem(key: K, value: V): Promise<void>;
}

/**
 * Driver interface to read/write all items at once.
 */
export interface StoreDriverMapped<K, V> {
  /**
   * Get all items.
   */
  getAll(): Promise<ReadonlyMap<K, V>>;
  /**
   * Replace all stored items with the given new items. That is keys became
   * missing will be removed from storage.
   */
  setAll(items: ReadonlyMap<K, V>): Promise<void>;
}

/**
 * Generalized interface covering all specific interfaces.
 */
export interface StoreDriver<K, V>
  extends StoreDriverSingle<K, V>,
    StoreDriverMapped<K, V> {}
