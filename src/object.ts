/**
 * @public
 *
 * @module
 */
import * as tf from "type-fest";
import type { Zip } from "./array.js";
import { isRecordObject } from "./predicate.js";
import type { IsLiteral } from "./ts.js";
import type { If } from "./ts/logical.js";
import type { ToArray } from "./ts/union.js";

/**
 * 对象键类型
 */
export type KeyOf<T> = keyof T;

/**
 * 对象值类型
 */
export type ValueOf<T> = T[keyof T];

/**
 * 对象元素类型
 */
export type EntriesOf<T> = If<
    IsLiteral<KeyOf<T>>,
    Zip<ToArray<KeyOf<T>>, ToArray<ValueOf<T>>>,
    [KeyOf<T>, ValueOf<T>][]
>;

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
 * 创建一个类型，该类型只能提供给定键中的一个
 *
 * @template T - 对象
 * @template K - 键的联合类型，默认值为任意一个键
 */
export type RequireExactlyOneKey<
    T extends object,
    K extends keyof T = keyof T,
> = tf.RequireAtLeastOne<T, K>;

/**
 * 创建一个类型，该类型只能提供给定键中的一个，或者不提供给定键
 *
 * @template T - 对象
 * @template K - 键的联合类型，默认值为任意一个键
 */
export type RequireOneOrNoneKey<
    T extends object,
    K extends keyof T = keyof T,
> = tf.RequireOneOrNone<T, K>;

/**
 * 创建一个类型，该类型只能提供所有或者完全不提供给定键
 *
 * @template T - 对象
 * @template K - 键的联合类型，默认值为任意一个键
 */
export type RequireAllOrNoneKey<
    T extends object,
    K extends keyof T = keyof T,
> = tf.RequireAllOrNone<T, K>;

/**
 * 创建一个仅包含指定值类型的键的联合类型
 *
 * 该类型类似 `keyof T`，但仅包含指定值类型的键。
 *
 * @template T - 对象
 * @template V - 值的联合类型
 */
export type PickKeysByValue<T, V> = tf.ConditionalKeys<T, V>;

/**
 * 创建一个排除指定值类型的键的联合类型
 *
 * 该类型类似 `keyof T`，但排除了指定值类型的键。
 *
 * @template T - 对象
 * @template V - 值的联合类型
 */
export type OmitKeysByValue<T, V> = Exclude<keyof T, tf.ConditionalKeys<T, V>>;

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
 * 创建一个排除指定值类型的键的类型
 *
 * @template T - 对象
 * @template V - 值的联合类型
 */
export type OmitValue<T, V> = tf.ConditionalExcept<T, V>;

/**
 * 创建一个仅包含指定值类型的键的类型
 *
 * @template T - 对象
 * @template V - 值的联合类型
 */
export type PickValue<T, V> = tf.ConditionalPick<T, V>;

/**
 * 合并两个类型，第二个类型的键将覆盖第一种类型的键
 */
export type Assign<Dest, Source> = tf.Merge<Dest, Source>;

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
 * 获取对象自身属性的描述符
 */
export function getOwnPropertyDescriptor(
    o: object,
    v: PropertyKey,
): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(o, v);
}

/**
 * 获取对象自身的所有属性键
 *
 * @param o 对象
 */
export function getOwnProperties(o: object): (string | symbol)[] {
    return Reflect.ownKeys(o);
}

/**
 * 获取对象自身所有属性的描述符
 */
export function getOwnPropertyDescriptors(
    o: object,
): RecordObject<PropertyDescriptor> {
    return Object.getOwnPropertyDescriptors(o);
}

/**
 * 获取对象自身的所有字符串属性键
 *
 * @param o 对象
 */
export function getOwnStringProperties(o: object): string[] {
    return Object.getOwnPropertyNames(o);
}

/**
 * 获取对象自身的所有字符串属性键
 *
 * @param o 对象
 */
export function getOwnSymbolProperties(o: object): symbol[] {
    return Object.getOwnPropertySymbols(o);
}

/**
 * 获取对象自身的所有可枚举字符串属性键
 *
 * @param o 对象
 */
export function getKeys(o: object): string[] {
    return Object.keys(o);
}

/**
 * 获取对象自身的所有可枚举字符串属性值
 *
 * @param o 对象
 */
export function getValues(o: object): unknown[] {
    return Object.values(o);
}

/**
 * 获取对象自身的所有可枚举字符串属性
 *
 * @param o 对象
 */
export function getEntries(o: object): [string, unknown][] {
    return Object.entries(o);
}

/**
 * 修剪所有值为 `undefined` 的属性，返回经过修剪的对象
 *
 * @returns 若 {@link opts.update} 为 `true`，则返回修剪过后的原对象，否则返回一个新对象
 */
export function prune<T extends object>(
    o: T,
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
        return _prune_new(o, deep, opts);
    } else {
        return _prune_update(o, deep, opts);
    }
}

function _prune_new<T extends object>(
    o: T,
    deep: boolean,
    opts: object | undefined,
): T {
    if (deep) {
        return Object.fromEntries(
            Object.entries(o)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => [key, prune(value, opts)]),
        ) as T;
    } else {
        return Object.fromEntries(
            Object.entries(o).filter(([, value]) => value !== undefined),
        ) as T;
    }
}

function _prune_update<T extends object>(
    o: T,
    deep: boolean,
    opts: object | undefined,
): T {
    for (const key in o) {
        if (Object.hasOwn(o, key)) {
            const value = o[key];
            if (value === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
                delete o[key];
            } else if (deep) {
                o[key] = isRecordObject(value) ? prune(value, opts) : value;
            }
        }
    }
    return o;
}

/**
 * 返回一个反转对象中的键和值的新对象
 *
 * 如果输入对象有重复的值，则使用最后出现的键作为输出对象中新键的值。
 *
 * 不包含原型链上的属性。
 *
 * @example
 * invert({ a: 1, b: 2, c: 3 });
 * // { 1: "a", 2: "b", 3: "c" }
 */
export function invert<K extends PropertyKey, V extends PropertyKey>(
    obj: Record<K, V>,
): Record<V, K> {
    const result = {} as Record<V, K>;

    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            const value = obj[key];
            result[value] = key;
        }
    }

    return result;
}
