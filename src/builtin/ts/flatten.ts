import type { PositiveInfinity } from "type-fest";
import type { Sub } from "./math.js";

/**
 * 展平值
 *
 * 支持以下类型：
 * - {@link Array}
 *
 * 不支持的类型将原样返回。
 */
export type Flatten<T> = T extends readonly unknown[] ? FlattenArray<T> : T;

/**
 * 递归地展平值
 *
 * 支持以下类型：
 * - {@link Array}
 *
 * 不支持的类型将原样返回。
 */
export type FlattenDeep<T> = T extends readonly unknown[]
    ? FlattenDeepArray<T>
    : T;

/**
 * 展平数组
 *
 * @template T 数组
 * @template Depth 展平深度，默认为 1
 *
 * @example
 * ```ts
 * FlattenArray<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, [6, 7]]
 * ```
 */
export type FlattenArray<
    T extends readonly unknown[],
    Depth extends number = 1,
> = Depth extends 0
    ? T
    : T extends readonly [infer U, ...infer R]
      ? U extends readonly unknown[]
          ? [...FlattenArray<U, Sub<Depth, 1>>, ...FlattenArray<R, Depth>]
          : [U, ...FlattenArray<R, Depth>]
      : [];

/**
 * 递归地展平数组
 *
 * @template T 数组
 *
 * @example
 * ```ts
 * FlattenDeepArray<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, 6, 7]
 * ```
 */
export type FlattenDeepArray<T extends readonly unknown[]> = FlattenArray<
    T,
    PositiveInfinity
>;
