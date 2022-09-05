import { StoreDriver } from './types';

/**
 * Create dummy no-op driver. Can be used for example in test environment to
 * omit actual driver. This driver always contains nothing in reads and does
 * nothing on writes.
 */
export function createNullDriver(): StoreDriver<any, any> {
  return new NullDriver();
}

class NullDriver implements StoreDriver<any, any> {
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
    return Promise.resolve(new Map());
  }
  setAll(items: ReadonlyMap<any, any>) {
    return Promise.resolve();
  }
}
