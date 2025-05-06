/**
 * @public
 *
 * @module
 */

import type { AnyMap, KeyOf, ValueOf } from "../collection.js";
import type { Getter } from "../protocol.js";

/**
 * {@link upsert} 处理函数类型
 */
export type UpsertHandler<T> = (value: T, update: boolean) => T;

/**
 * 获取现有键值，若不存在则插入新键值对
 */
// FIXME: getsert 提案普及后移除 https://github.com/tc39/proposal-upsert
export function getsert<T extends AnyMap>(
    map: T,
    key: KeyOf<T>,
    insertValue: ValueOf<T>,
): ValueOf<T> {
    if (!map.has(key as WeakKey)) {
        map.set(key as WeakKey, insertValue);
    }
    return map.get(key as WeakKey) as ValueOf<T>;
}

/**
 * 获取现有键值，若不存在则插入新键值对
 */
// FIXME: getsert 提案普及后移除 https://github.com/tc39/proposal-upsert
export function getsertComputed<T extends AnyMap>(
    map: T,
    key: KeyOf<T>,
    insertValueGetter: Getter<ValueOf<T>>,
): ValueOf<T> {
    if (!map.has(key as WeakKey)) {
        map.set(key as WeakKey, insertValueGetter());
    }
    return map.get(key as WeakKey) as ValueOf<T>;
}

/**
 * 更新现有键值，若不存在则插入新键值对
 */
export function upsert<T extends AnyMap>(
    map: T,
    key: KeyOf<T>,
    handler: UpsertHandler<ValueOf<T>>,
): ValueOf<T> {
    if (map.has(key as WeakKey)) {
        let value = map.get(key as WeakKey) as ValueOf<T>;
        value = handler(value, true);
        map.set(key as WeakKey, value);
        return value;
    } else {
        const value = handler(undefined!, false);
        map.set(key as WeakKey, value);
        return value;
    }
}

/**
 * 修剪 {@link Map} 所有键或值为 `undefined` 的键值对
 */
export function prune<T extends Map<unknown, unknown>>(v: T): T {
    for (const [key, value] of v) {
        if (key === undefined || value === undefined) {
            v.delete(key);
        }
    }
    return v;
}
