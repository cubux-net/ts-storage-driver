# Changelog

## 0.2.0 (2022-09-08)

- **BREAKING**: Interface `IndexedDBOptions` became generic with 2 required
  parameters and 1 optional.
- Add: Serialization ability for `indexedDB` driver. New options in
  `IndexedDBOptions`: `serialize` and `unserialize`. So,
  `createIndexedDBDriver()` generic now has one more (3rd) optional type
  parameter.

## 0.1.0 (2022-09-06)

- First release.
