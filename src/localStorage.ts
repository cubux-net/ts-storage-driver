import { StoreDriver } from './types';

/**
 * Options to customize driver
 */
export interface LocalStorageOptions<V = any> {
  /**
   * Actual data storage. Default: `window.localStorage`.
   */
  storage?: Storage;
  /**
   * Key prefix in `storage` to distinguish only related keys. Default is
   * `"persistent"`.
   */
  prefix?: string;
  /**
   * Custom function to serialize input value to string before putting it into
   * `storage`. Default is `JSON.stringify`.
   */
  serialize?: (value: V) => string;
  /**
   * Custom function to unserialize data read from `storage`. Default is
   * `JSON.parse`.
   */
  unserialize?: (data: string) => V;
  // TODO: error handling design to deal with serialize/unserialize errors
}
interface OptionsStrict<V> extends Required<LocalStorageOptions<V>> {}

const KS = ':';

/**
 * Create driver to interact with `localStorage`-like storage. Actual storage
 * can be set in `options`, so it could be `sessionStorage` for example or
 * another compatible alternative.
 */
export function createLocalStorageDriver<V>(
  options: LocalStorageOptions<V> = {}
): StoreDriver<string, V> {
  return new LocalStorageDriver<V>({
    // ...options,
    storage: options.storage ?? window.localStorage,
    prefix: options.prefix ?? 'persistent',
    serialize: options.serialize ?? JSON.stringify,
    unserialize: options.unserialize ?? JSON.parse,
  });
}

class LocalStorageDriver<V> implements StoreDriver<string, V> {
  #opt: OptionsStrict<V>;

  constructor(options: OptionsStrict<V>) {
    this.#opt = options;
  }

  getAll(): Promise<ReadonlyMap<string, V>> {
    const { storage, prefix, unserialize } = this.#opt;
    const prefixKS = prefix + KS;
    const prefixSkip = prefixKS.length;

    const items = new Map<string, V>();
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefixKS)) {
        items.set(
          key.substring(prefixSkip),
          unserialize(storage.getItem(key)!)
        );
      }
    }
    return Promise.resolve(items);
  }

  getItem(key: string): Promise<V | undefined> {
    const { storage, prefix, unserialize } = this.#opt;

    const v = storage.getItem(prefix + KS + key);
    return Promise.resolve(v !== null ? unserialize(v) : undefined);
  }

  removeItem(key: string): Promise<void> {
    const { storage, prefix } = this.#opt;

    storage.removeItem(prefix + KS + key);
    return Promise.resolve();
  }

  setAll(items: ReadonlyMap<string, V>): Promise<void> {
    const { storage, prefix, serialize } = this.#opt;
    const prefixKS = prefix + KS;
    const prefixSkip = prefixKS.length;

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (
        key &&
        key.startsWith(prefixKS) &&
        !items.has(key.substring(prefixSkip))
      ) {
        storage.removeItem(key);
      }
    }
    for (const [key, value] of Array.from(items)) {
      storage.setItem(prefix + KS + key, serialize(value));
    }
    return Promise.resolve();
  }

  setItem(key: string, value: V): Promise<void> {
    const { storage, prefix, serialize } = this.#opt;

    storage.setItem(prefix + KS + key, serialize(value));
    return Promise.resolve();
  }
}
