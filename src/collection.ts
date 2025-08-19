/**
 * Collection utilities.
 *
 * @public
 * @module
 */

/**
 * Represents a collection.
 */
export type Collection<K = unknown, V = unknown> = Map<K, V> | Set<V>;

/**
 * Represents a weak reference collection.
 */
export type WeakCollection<T extends WeakKey = WeakKey, V = unknown> =
  | WeakMap<T, V>
  | WeakSet<T>;

/**
 * Represents any collection.
 */
export type AnyCollection = Collection | WeakCollection;

/**
 * Represents any map.
 */
export type AnyMap<K = unknown, V = unknown> =
  | Map<K, V>
  | WeakMap<K & WeakKey, V>;

/**
 * Represents any set.
 */
export type AnySet<T = unknown> = Set<T> | WeakSet<T & WeakKey>;

/**
 * Extracts the key type of an {@link AnyMap} type.
 */
export type KeyOf<T extends AnyMap> =
  T extends Map<infer K, infer V>
    ? K
    : T extends WeakMap<infer K, infer V>
      ? K
      : never;

/**
 * Extracts the value type of an {@link AnyCollection}.
 *
 * @template T The collection type.
 */
export type ValueOf<T extends AnyCollection> =
  T extends Map<infer K, infer V>
    ? V
    : T extends WeakMap<infer K, infer V>
      ? V
      : T extends Set<infer V>
        ? V
        : T extends WeakSet<infer V>
          ? V
          : never;

/**
 * Extracts the entries of an {@link AnyCollection} as an array of `[key, value]` tuples.
 *
 * @template T The collection type.
 */
export type EntriesOf<T extends AnyCollection> =
  T extends Map<infer K, infer V>
    ? [K, V][]
    : T extends WeakMap<infer K, infer V>
      ? [K, V][]
      : T extends Set<infer V>
        ? [V, V][]
        : T extends WeakSet<infer V>
          ? [V, V][]
          : never;
