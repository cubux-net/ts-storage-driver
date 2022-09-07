import { StoreDriver } from './types';

type AnyK = Exclude<IDBValidKey, any[]>;

/**
 * Options to customize driver
 */
export interface IndexedDBOptions<K extends AnyK, V, S = V> {
  /**
   * Database name.
   */
  dbName: string;
  /**
   * Database version. Probably, this option should internal. Default is `1`.
   */
  dbVersion?: number;
  /**
   * Object store name (aka table name).
   */
  table: string;
  /**
   * Actual `indexedDB` factory. Default is `window.indexedDB`. Can be used in
   * tests to mock implementation or to use custom polyfill implementation.
   */
  indexedDB?: IDBFactory;
  /**
   * Custom function to serialize input value before putting it into DB.
   */
  serialize?: (value: V, key: K) => S;
  /**
   * Custom function to unserialize data read from DB.
   */
  unserialize?: (data: S, key: K) => V;
  // TODO: error handling design to deal with serialize/unserialize errors
}
interface OptionsStrict<K extends AnyK, V, S>
  extends Required<IndexedDBOptions<K, V, S>> {}

const F_KEY = 'key';
const F_VALUE = 'value';
const asIs = <T>(v: T) => v;

/**
 * Create driver to interact with `indexedDB`-like storage. Actual storage
 * can be overridden in `options`.
 */
export function createIndexedDBDriver<K extends AnyK, V, S = V>(
  options: IndexedDBOptions<K, V, S>
): Promise<StoreDriver<K, V>> {
  const opt: OptionsStrict<K, V, S> = {
    ...options,
    dbVersion: options.dbVersion ?? 1,
    indexedDB: options.indexedDB ?? window.indexedDB,
    serialize: options.serialize ?? (asIs as any),
    unserialize: options.unserialize ?? (asIs as any),
  };

  return new Promise((resolve, reject) => {
    const onerror = () => {
      reject(new Error('Could not load database'));
    };

    const r = opt.indexedDB.open(opt.dbName, opt.dbVersion);
    r.onerror = onerror;
    r.onupgradeneeded = () => {
      const db = r.result;
      db.onerror = onerror;
      db.createObjectStore(opt.table, { keyPath: F_KEY });
    };
    r.onsuccess = () => resolve(new IndexedDBDriver(r.result, opt));
  });
}

class IndexedDBDriver<K extends AnyK, V, S> implements StoreDriver<K, V> {
  #db: IDBDatabase;
  #opt: OptionsStrict<K, V, S>;

  constructor(db: IDBDatabase, options: OptionsStrict<K, V, S>) {
    this.#db = db;
    this.#opt = options;
  }

  getAll(): Promise<ReadonlyMap<K, V>> {
    const { table, unserialize } = this.#opt;
    return new Promise((resolve, reject) => {
      const items = new Map<K, V>();

      const r = this.#db.transaction(table).objectStore(table).openCursor();

      r.onerror = () =>
        reject(new Error('Could not read database object store'));

      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          const v = cursor.value;
          const k: K = v[F_KEY];
          items.set(k, unserialize(v[F_VALUE], k));
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    });
  }

  getItem(key: K): Promise<V | undefined> {
    const { table, unserialize } = this.#opt;
    return new Promise((resolve, reject) => {
      const r = this.#db.transaction(table).objectStore(table).openCursor(key);

      r.onerror = () =>
        reject(new Error('Could not read database object store'));

      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          const v = cursor.value;
          resolve(unserialize(v[F_VALUE], key));
        } else {
          resolve(undefined);
        }
      };
    });
  }

  removeItem(key: K): Promise<void> {
    const { table } = this.#opt;
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction(table, 'readwrite')
        .objectStore(table)
        .delete(key);

      r.onerror = () =>
        reject(new Error('Could not write database object store'));

      r.onsuccess = () => resolve();
    });
  }

  setAll(items: ReadonlyMap<K, V>): Promise<void> {
    const { table, serialize } = this.#opt;
    return new Promise((resolve, reject) => {
      const tr = this.#db.transaction(table, 'readwrite');

      tr.onerror = () => reject(new Error('Database transaction failed'));
      tr.oncomplete = () => resolve();

      const store = tr.objectStore(table);

      new Promise<readonly K[]>((res) => {
        const toDelete: K[] = [];
        const r = store.openCursor();

        r.onerror = () =>
          reject(new Error('Could not read database object store'));

        r.onsuccess = () => {
          const cursor = r.result;
          if (cursor) {
            const v = cursor.value;
            toDelete.push(v[F_KEY]);
            cursor.continue();
          } else {
            res(toDelete);
          }
        };
      })
        .then((toDelete) =>
          [
            ...toDelete.map((key) => store.delete(key)),
            ...Array.from(items).map(([key, value]) =>
              store.put({ [F_KEY]: key, [F_VALUE]: serialize(value, key) })
            ),
          ].map((r) => {
            r.onerror = () =>
              reject(new Error('Could not write database object store'));
          })
        )
        .catch(reject);
    });
  }

  setItem(key: K, value: V): Promise<void> {
    const { table, serialize } = this.#opt;
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction(table, 'readwrite')
        .objectStore(table)
        .put({
          [F_KEY]: key,
          [F_VALUE]: serialize(value, key),
        });

      r.onerror = () =>
        reject(new Error('Could not write database object store'));

      r.onsuccess = () => resolve();
    });
  }
}
