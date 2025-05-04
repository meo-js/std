/**
 * @public
 *
 * @module
 */

/**
 * 任意集合类型
 */
export type AnyCollection = Collection | WeakCollection;

/**
 * 集合类型
 */
export type Collection<K = unknown, V = unknown> = Map<K, V> | Set<V>;

/**
 * 弱引用集合类型
 */
export type WeakCollection<T extends WeakKey = WeakKey, V = unknown> =
    | WeakMap<T, V>
    | WeakSet<T>;

/**
 * 类 {@link Map} 集合类型
 */
export type AnyMap<K = unknown, V = unknown> =
    | Map<K, V>
    | WeakMap<K & WeakKey, V>;

/**
 * 类 {@link Set} 集合类型
 */
export type AnySet<T = unknown> = Set<T> | WeakSet<T & WeakKey>;

/**
 * {@link AnyCollection} 的键类型
 */
export type CollectionKey<T extends AnyMap> =
    T extends Map<infer K, infer V>
        ? K
        : T extends WeakMap<infer K, infer V>
          ? K
          : never;

/**
 * {@link AnyCollection} 的值类型
 */
export type CollectionValue<T extends AnyCollection> =
    T extends Map<infer K, infer V>
        ? V
        : T extends WeakMap<infer K, infer V>
          ? V
          : T extends Set<infer V>
            ? V
            : T extends WeakSet<infer V>
              ? V
              : never;
