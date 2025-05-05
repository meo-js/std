/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";

/**
 * 将联合类型转换为交叉类型
 *
 * @example
 * ```ts
 * type A = { a: number };
 * type B = { b: string };
 * type C = { c: boolean };
 *
 * type U = A | B | C;
 * type I = Intersection<Union>;
 * // I = A & B & C
 * ```
 */
export type ToIntersection<Union> = tf.UnionToIntersection<Union>;

/**
 * 转换为联合类型
 *
 * 当前支持从以下类型转换：
 *
 * - {@link Array}
 */
export type ToUnion<T> = tf.TupleToUnion<T>;

/**
 * 将联合类型转换为数组
 *
 * @example
 * ```ts
 * type U = "cat" | "dog" | "snake";
 * type I = Intersection<U>;
 * // I = ["cat", "dog", "snake"]
 * ```
 */
export type ToArray<T> = tf.UnionToTuple<T>;
