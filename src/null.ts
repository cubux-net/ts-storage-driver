import { StoreDriver } from './types';

/**
 * Create dummy no-op driver. Can be used for example in test environment to
 * omit actual driver. This driver always contains nothing in reads and does
 * nothing on writes.
 */
interface CreateNullDriverFn {
  /**
   * Create dummy no-op driver. Can be used for example in test environment to
   * omit actual driver. This driver always contains nothing in reads and does
   * nothing on writes.
   */
  <K, V>(): StoreDriver<K, V, never>;

  /**
   * Create dummy no-op driver. Can be used for example in test environment to
   * omit actual driver. This driver always contains nothing in reads and does
   * nothing on writes.
   */
  <K>(): StoreDriver<K, any, never>;

  /**
   * Create dummy no-op driver. Can be used for example in test environment to
   * omit actual driver. This driver always contains nothing in reads and does
   * nothing on writes.
   */
  (): StoreDriver<any, any, never>;
}

/**
 * Create dummy no-op driver. Can be used for example in test environment to
 * omit actual driver. This driver always contains nothing in reads and does
 * nothing on writes.
 */
export const createNullDriver: CreateNullDriverFn = () => new NullDriver();

class NullDriver implements StoreDriver<any, any, never> {
  getItem(key: any) {
    return Promise.resolve(undefined);
  }
  removeItem(key: any) {
    return Promise.resolve();
  }
  setItem(key: any, value: any) {
    return Promise.resolve();
  }
  getAll() {
    return Promise.resolve(new Map<any, never>());
  }
  setAll(items: ReadonlyMap<any, any>) {
    return Promise.resolve();
  }
}
