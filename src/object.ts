/**
 * @public
 *
 * @module
 */
import * as tf from "type-fest";
import { isRecordObject } from "./predicate.js";

/**
 * `Record<PropertyKey, V>` 的别名类型
 */
export type RecordObject<V = unknown> = Record<PropertyKey, V>;

/**
 * 只有字符串键的对象，等同于 `Record<string, V>`
 */
export type PlainObject<V = unknown> = Record<string, V>;

/**
 * 严格为空的对象，比使用 `{}` 更像是预期的 `{}` 行为
 */
export type EmptyObject = tf.EmptyObject;

/**
 * 创建一个类型，该类型至少需要给定键中的一个
 *
 * @template T - 对象
 * @template K - 键的联合类型，默认值为任意一个键
 */
export type RequireLeastOneKey<
    T extends object,
    K extends keyof T = keyof T,
> = tf.RequireAtLeastOne<T, K>;

/**
 * 创建一个排除指定键的类型
 *
 * 该类型相当于更严格版本的 {@link Omit} 类型。
 *
 * @template T - 对象
 * @template K - 键的联合类型
 */
export type OmitKey<T, K extends keyof T> = tf.Except<
    T,
    K,
    { requireExactProps: false }
>;

/**
 * 创建一个仅包含指定键的类型
 *
 * 该类型相当于 {@link Pick} 类型。
 *
 * @template T - 对象
 * @template K - 键的联合类型
 */
export type PickKey<T, K extends keyof T> = Pick<T, K>;

/**
 * @returns 若属性在原型链中存在则返回 `true`，否则返回 `false`
 */
export function hasProperty(o: object, v: PropertyKey): boolean {
    return v in o;
}

/**
 * @returns 若属性在对象中存在则返回 `true`，否则返回 `false`
 */
export function hasOwnProperty(o: object, v: PropertyKey): boolean {
    return Object.hasOwn(o, v);
}

/**
 * 修剪所有值为 `undefined` 的属性，返回经过修剪的对象
 *
 * @returns 若 {@link opts.update} 为 `true`，则返回修剪过后的原对象，否则返回一个新对象
 */
export function prune<T extends object>(
    v: T,
    opts?: {
        /**
         * 是否深度递归地修剪
         *
         * 仅会修剪通过 {@link isRecordObject} 判定为 `true` 的对象。
         *
         * @default false
         */
        deep?: boolean;

        /**
         * 是否修剪原对象
         *
         * @default false
         */
        update?: boolean;
    },
): T {
    const deep = opts?.deep ?? false;
    const update = opts?.update ?? false;

    if (!update) {
        return _prune_new(v, deep, opts);
    } else {
        return _prune_update(v, deep, opts);
    }
}

function _prune_new<T extends object>(
    v: T,
    deep: boolean,
    opts: object | undefined,
): T {
    if (deep) {
        return Object.fromEntries(
            Object.entries(v)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => [key, prune(value, opts)]),
        ) as T;
    } else {
        return Object.fromEntries(
            Object.entries(v).filter(([, value]) => value !== undefined),
        ) as T;
    }
}

function _prune_update<T extends object>(
    v: T,
    deep: boolean,
    opts: object | undefined,
): T {
    for (const key in v) {
        if (Object.hasOwn(v, key)) {
            const value = v[key];
            if (value === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
                delete v[key];
            } else if (deep) {
                v[key] = isRecordObject(value) ? prune(value, opts) : value;
            }
        }
    }
    return v;
}
