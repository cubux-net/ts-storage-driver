# Changelog

## 0.4.0 (2023-12-06)

- **BREAKING**: Drop Node < 18.
- Add: Allow TypeScript 5 in `peerDependencies`.

## 0.3.1 (2022-09-10)

- Fix: `setAll()` in `indexedDB` driver fails to write in some cases. Whole
  method optimized with help of `indexedDB` docs.

## 0.3.0 (2022-09-10)

- Upd: improve type inference for `createNullDriver()` call.

## 0.2.0 (2022-09-08)

- **BREAKING**: Interface `IndexedDBOptions` became generic with 2 required
  parameters and 1 optional.
- Add: Serialization ability for `indexedDB` driver. New options in
  `IndexedDBOptions`: `serialize` and `unserialize`. So,
  `createIndexedDBDriver()` generic now has one more (3rd) optional type
  parameter.

## 0.1.0 (2022-09-06)

- First release.
