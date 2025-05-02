/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";
import type { Rng } from "./protocol.js";
import type { PositiveInfinity, Sub } from "./ts/math.js";

/**
 * 数组索引的联合类型
 */
export type ArrayIndices<T extends readonly unknown[]> = tf.ArrayIndices<T>;

/**
 * 数组索引的联合类型
 */
export type ArrayValues<T extends readonly unknown[]> = tf.ArrayValues<T>;

/**
 * 数组转为对象类型
 */
export type ArrayToObject<T extends readonly unknown[]> = tf.TupleToObject<T>;

/**
 * 数组的第一个元素
 */
export type First<T extends readonly unknown[]> = T extends readonly [
    infer F,
    ...unknown[],
]
    ? F
    : never;

/**
 * 数组的最后一个元素
 */
export type Last<T extends readonly unknown[]> = tf.LastArrayElement<T>;

/**
 * 数组的除第一个元素外的剩余元素
 */
export type Rest<T extends readonly unknown[]> = T extends readonly [
    unknown,
    ...infer R,
]
    ? R
    : never;

/**
 * 展平数组
 *
 * @template T 数组
 * @template Depth 展平深度，默认为 1
 *
 * @example
 * ```ts
 * Flat<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, [6, 7]]
 * ```
 */
export type Flat<
    T extends readonly unknown[],
    Depth extends number = 1,
> = Depth extends 0
    ? T
    : T extends readonly [infer U, ...infer R]
      ? U extends readonly unknown[]
          ? [...Flat<U, Sub<Depth, 1>>, ...Flat<R, Depth>]
          : [U, ...Flat<R, Depth>]
      : [];

/**
 * 递归地展平数组
 *
 * @template T 数组
 *
 * @example
 * ```ts
 * FlatDeep<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, 6, 7]
 * ```
 */
export type FlatDeep<T extends readonly unknown[]> = Flat<T, PositiveInfinity>;

/**
 * 值或值类型的数组
 */
export type Arrayable<T> = tf.Arrayable<T>;

/**
 * 快速移除数组指定下标成员
 *
 * 采用直接与最后一位成员交换的方式进行移除，函数未进行下标检查。
 *
 * @param arr 数组
 * @param index 数组下标
 */
export function fastRemoveAt(arr: unknown[], index: number) {
    arr[index] = arr[arr.length - 1];
    arr.pop();
}

/**
 * 快速移除数组指定成员，返回是否移除成功
 *
 * 采用直接与最后一位成员交换的方式进行移除。
 *
 * @param arr 数组
 * @param value 成员
 */
export function fastRemove(arr: unknown[], value: unknown) {
    const index = arr.indexOf(value);
    if (index === -1) return false;
    fastRemoveAt(arr, index);
    return true;
}

/**
 * 移除数组指定下标成员
 *
 * 函数未进行下标检查。
 *
 * @param arr 数组
 * @param index 下标
 */
export function removeAt(arr: unknown[], index: number) {
    arr.splice(index, 1);
}

/**
 * 移除指定数组成员，返回是否移除成功
 *
 * @param arr 数组
 * @param value 成员
 */
export function remove(arr: unknown[], value: unknown) {
    const index = arr.indexOf(value);
    if (index === -1) return false;
    removeAt(arr, index);
    return true;
}

/**
 * 插入值到指定数组下标
 *
 * @param arr 数组
 * @param value 值
 * @param index 下标
 */
export function insert(arr: unknown[], value: unknown, index: number) {
    arr.splice(index, 0, value);
}

/**
 * 随机打乱数组
 *
 * @param arr 数组
 * @param rng 随机数生成函数，默认 {@link Math.random}
 */
export function shuffle<T>(arr: T[], rng: Rng = Math.random) {
    let m = arr.length,
        t = undefined,
        i = 0;

    while (m !== 0) {
        i = Math.floor(rng() * m--);
        t = arr[m];
        arr[m] = arr[i];
        arr[i] = t;
    }

    return arr;
}

/**
 * 删除 {@link Array} 所有 `undefined` 的值
 */
export function prune<T extends unknown[]>(v: T): T {
    for (let i = v.length - 1; i >= 0; i--) {
        if (v[i] === undefined) {
            v.splice(i, 1);
        }
    }
    return v;
}
