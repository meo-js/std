/**
 * @public
 *
 * @module
 */
import * as tf from "type-fest";
import { isBigInt, isNumber } from "./predicate.js";
import type { And, Not } from "./ts/logical.js";

/**
 * {@link Number} 或 {@link BigInt} 类型
 */
export type Numeric = number | bigint;

/**
 * 数值 0
 */
export type Zero = 0 | 0n;

/**
 * {@link Number.POSITIVE_INFINITY}
 */
export type INF = tf.PositiveInfinity;

/**
 * {@link Number.NEGATIVE_INFINITY}
 */
export type NINF = tf.NegativeInfinity;

/**
 * 返回 {@link A} 加上 {@link B} 的结果
 *
 * 注意：
 * - 仅支持数值范围 `-999 ~ 999`
 */
export type Sum<A extends number, B extends number> = tf.Sum<A, B>;

/**
 * 返回 {@link A} 减去 {@link B} 的结果
 *
 * 注意：
 * - 仅支持数值范围 `-999 ~ 999`
 */
export type Sub<A extends number, B extends number> = tf.Subtract<A, B>;

/**
 * 判断 {@link A} 是否大于 {@link B}
 */
export type Gt<A extends number, B extends number> = tf.GreaterThan<A, B>;

/**
 * 判断 {@link A} 是否大于等于 {@link B}
 */
export type Gte<A extends number, B extends number> = tf.GreaterThanOrEqual<
    A,
    B
>;

/**
 * 判断 {@link A} 是否小于 {@link B}
 */
export type Lt<A extends number, B extends number> = tf.LessThan<A, B>;

/**
 * 判断 {@link A} 是否小于等于 {@link B}
 */
export type Lte<A extends number, B extends number> = tf.LessThanOrEqual<A, B>;

/**
 * 判断 {@link A} 是否等于 {@link B}
 */
export type Eq<A extends number, B extends number> = And<Gte<A, B>, Lte<A, B>>;

/**
 * 判断 {@link A} 是否不等于 {@link B}
 */
export type Neq<A extends number, B extends number> = Not<Eq<A, B>>;

/**
 * 返回指定范围内的整数联合类型
 *
 * @template Start - 起始值
 * @template End - 结束值（不包括）
 * @template Step - 步长，默认为 `1`
 */
export type IntRangeOf<
    Start extends number,
    End extends number,
    Step extends number = 1,
> = tf.IntRange<Start, End, Step>;

/**
 * 判断是否为负数
 */
export type IsNegative<T extends Numeric> = tf.IsNegative<T>;

/**
 * 判断是否为正数
 */
export type IsPositive<T extends Numeric> = T extends Zero
    ? false
    : `${T}` extends `-${string}`
      ? false
      : true;

/**
 * 判断是否为零
 */
export type IsZero<T extends Numeric> = T extends Zero ? true : false;

/**
 * 判断是否为整数
 */
export type IsInteger<T extends Numeric> = tf.IsInteger<T>;

/**
 * 判断是否为浮点数
 */
export type IsFloat<T extends Numeric> = tf.IsFloat<T>;

/**
 * {@link Number.POSITIVE_INFINITY}
 */
export const INF = Number.POSITIVE_INFINITY;

/**
 * {@link Number.NEGATIVE_INFINITY}
 */
export const NINF = Number.NEGATIVE_INFINITY;

/**
 * {@link Number.MAX_SAFE_INTEGER}
 */
export const MAX_INT = Number.MAX_SAFE_INTEGER;

/**
 * {@link Number.MIN_SAFE_INTEGER}
 */
export const MIN_INT = Number.MIN_SAFE_INTEGER;

/**
 * {@link Number.MAX_VALUE}
 */
export const MAX_VAL = Number.MAX_VALUE;

/**
 * {@link Number.MIN_VALUE}
 */
export const MIN_VAL = Number.MIN_VALUE;

/**
 * {@link Number.EPSILON}
 */
export const EPSILON = Number.EPSILON;

/**
 * {@link Number.NaN}
 */
export const NAN = Number.NaN;

/**
 * 检测值是否为整数
 *
 * - 如果值为 {@link BigInt}，则返回 `true`。
 * - 如果值为 {@link Number}，则相当于调用 {@link Number.isSafeInteger}。
 */
export function isInteger(value: unknown): boolean {
    if (isBigInt(value)) {
        return true;
    } else {
        return Number.isSafeInteger(value);
    }
}

/**
 * 检测值是否为浮点数
 *
 * - 如果值为 {@link BigInt}，则返回 `false`。
 * - 如果值为 {@link Number}，则相当于调用 {@link Number.isFinite} 并检查 {@link Math.floor} 后的值是否不相等。
 */
export function isFloat(value: unknown): boolean {
    if (isBigInt(value)) {
        return false;
    } else if (isNumber(value)) {
        const int = Math.floor(value);
        return isFinite(int) && int !== value;
    } else {
        return false;
    }
}

/**
 * 检测值是否为有限数值
 *
 * - 如果值为 {@link BigInt}，则返回 `true`。
 * - 如果值为 {@link Number}，则相当于调用 {@link Number.isFinite}。
 */
export function isFinite(value: unknown): boolean {
    if (isBigInt(value)) {
        return true;
    } else {
        return Number.isFinite(value);
    }
}

/**
 * 检测值是否为无限数值
 */
export function isInfinity(value: unknown): boolean {
    return value === INF || value === NINF;
}
