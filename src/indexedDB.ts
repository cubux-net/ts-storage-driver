import { StoreDriver } from './types';

/**
 * Options to customize driver
 */
export interface IndexedDBOptions {
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
}
interface OptionsStrict extends Required<IndexedDBOptions> {}

type AnyK = Exclude<IDBValidKey, any[]>;

const F_KEY = 'key';
const F_VALUE = 'value';

/**
 * Create driver to interact with `indexedDB`-like storage. Actual storage
 * can be overridden in `options`.
 */
export function createIndexedDBDriver<K extends AnyK, V>(
  options: IndexedDBOptions
): Promise<StoreDriver<K, V>> {
  const opt: OptionsStrict = {
    ...options,
    dbVersion: options.dbVersion ?? 1,
    indexedDB: options.indexedDB ?? window.indexedDB,
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
    r.onsuccess = () => resolve(new IndexedDBDriver<K, V>(r.result, opt));
  });
}

class IndexedDBDriver<K extends AnyK, V> implements StoreDriver<K, V> {
  #db: IDBDatabase;
  #opt: OptionsStrict;

  constructor(db: IDBDatabase, options: OptionsStrict) {
    this.#db = db;
    this.#opt = options;
  }

  getAll(): Promise<ReadonlyMap<K, V>> {
    return new Promise((resolve, reject) => {
      const items = new Map<K, V>();

      const r = this.#db
        .transaction(this.#opt.table)
        .objectStore(this.#opt.table)
        .openCursor();

      r.onerror = () =>
        reject(new Error('Could not read database object store'));

      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          const v = cursor.value;
          items.set(v[F_KEY], v[F_VALUE]);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    });
  }

  getItem(key: K): Promise<V | undefined> {
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction(this.#opt.table)
        .objectStore(this.#opt.table)
        .openCursor(key);

      r.onerror = () =>
        reject(new Error('Could not read database object store'));

      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          const v = cursor.value;
          resolve(v[F_VALUE]);
        } else {
          resolve(undefined);
        }
      };
    });
  }

  removeItem(key: K): Promise<void> {
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction(this.#opt.table, 'readwrite')
        .objectStore(this.#opt.table)
        .delete(key);

      r.onerror = () =>
        reject(new Error('Could not write database object store'));

      r.onsuccess = () => resolve();
    });
  }

  setAll(items: ReadonlyMap<K, V>): Promise<void> {
    return new Promise((resolve, reject) => {
      const tr = this.#db.transaction(this.#opt.table, 'readwrite');

      tr.onerror = () => reject(new Error('Database transaction failed'));
      tr.oncomplete = () => resolve();

      const store = tr.objectStore(this.#opt.table);

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
              store.put({ [F_KEY]: key, [F_VALUE]: value })
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
    return new Promise((resolve, reject) => {
      const r = this.#db
        .transaction(this.#opt.table, 'readwrite')
        .objectStore(this.#opt.table)
        .put({
          [F_KEY]: key,
          [F_VALUE]: value,
        });

      r.onerror = () =>
        reject(new Error('Could not write database object store'));

      r.onsuccess = () => resolve();
    });
  }
}
