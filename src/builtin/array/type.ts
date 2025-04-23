import type * as tf from "type-fest";
import type { Any, Anys } from "../ts/any.js";
import type { Simplify } from "../ts/simplify.js";

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
export type ArrayToObject<T extends readonly unknown[]> = Simplify<{
    [K in keyof T as Exclude<K, keyof Anys>]: T[K];
}>;

/**
 * 数组的第一个元素
 */
export type First<T extends readonly unknown[]> = T extends readonly [
    infer F,
    ...Anys,
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
    Any,
    ...infer R,
]
    ? R
    : never;

/**
 * 值或值类型的数组
 */
export type Arrayable<T> = tf.Arrayable<T>;
