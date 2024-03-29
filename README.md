# `@cubux/storage-driver`

[![NPM latest](https://img.shields.io/npm/v/@cubux/storage-driver.svg)](https://www.npmjs.com/package/@cubux/storage-driver)

Simple storage driver abstraction for [`@cubux/effector-persistent`](https://github.com/cubux-net/effector-persistent).
Persist you `effector` Store with `localStorage`/`sessionStorage`, `indexedDB`,
or implement a custom driver.

## Install

```sh
npm i @cubux/storage-driver
```

## API

### `interface StoreDriverSingle<K, V, VOut = V>`

Driver interface to read/write data by single item.

#### Methods

##### `getItem(key: K): Promise<VOut | undefined>`

Get value of specific item with the given key.

##### `removeItem(key: K): Promise<void>`

Remove item with the given key.

##### `setItem(key: K, value: V): Promise<void>`

Store the given value in item with the given key.

### `interface StoreDriverMapped<K, V, VOut = V>`

Driver interface to read/write all items at once.

#### Methods

##### `getAll(): Promise<ReadonlyMap<K, VOut>>`

Get all items.

##### `setAll(items: ReadonlyMap<K, V>): Promise<void>`

Replace all stored items with the given new items. That is keys became missing
will be removed from storage.

### `interface StoreDriver<K, V, VOut = V>`

Generalized interface covering all specific interfaces above.

### `createLocalStorageDriver()`

Create driver to interact with `localStorage`-like storage. Actual storage
can be set in `options`, so it could be `sessionStorage` for example or
another compatible alternative.

```ts
function createLocalStorageDriver<V>(
  options?: LocalStorageOptions<V>,
): StoreDriver<string, V>
```

Options `LocalStorageOptions<V>` to customize driver:

| Option        | Type                   | Default               | Description                                                                          |
|---------------|------------------------|-----------------------|--------------------------------------------------------------------------------------|
| `storage`     | `Storage`              | `window.localStorage` | Actual data storage.                                                                 |
| `prefix`      | `string`               | `"persistent"`        | Key prefix in `storage` to distinguish only related keys.                            |
| `serialize`   | `(value: V) => string` | `JSON.stringify`      | Custom function to serialize input value to string before putting it into `storage`. |
| `unserialize` | `(data: string) => V`  | `JSON.parse`          | Custom function to unserialize data read from `storage`.                                                                                     |

### `createIndexedDBDriver()`

Create driver to interact with `indexedDB`-like storage. Actual storage can be
overridden in `options`.

```ts
function createIndexedDBDriver<K, V, S = V>(
  options: IndexedDBOptions<K, V, S>
): Promise<StoreDriver<K, V>>
```

Options `IndexedDBOptions<K, V, S>` to customize driver:

| Option        | Type                      | Default            | Description                                                                                                                                      |
|---------------|---------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `dbName`      | `string`                  | **Required**       | Database name.                                                                                                                                   |
| `dbVersion`   | `number`                  | `1`                | Database version. Probably, this option should internal.                                                                                         |
| `table`       | `string`                  | **Required**       | Object store name (aka table name).                                                                                                              |
| `indexedDB`   | `IDBFactory`              | `window.indexedDB` | Actual `indexedDB` factory. Default is `window.indexedDB`. Can be used in tests to mock implementation or to use custom polyfill implementation. |
| `serialize`   | `(value: V, key: K) => S` | `(v) => v`         | Custom function to serialize input value before putting it into DB.                                                                              |
| `unserialize` | `(data: S, key: K) => V`  | `(v) => v`         | Custom function to unserialize data read from DB.                                                                                                |

### `createNullDriver()`

Create dummy no-op driver. Can be used for example in test environment to omit
actual driver. This driver always contains nothing in reads and does nothing on
writes.

```ts
function createNullDriver<K = any, V = any>(): StoreDriver<K, V, never>
```
