/**
 * @public
 *
 * @module
 */
import * as tf from "type-fest";
import { isBigInt } from "./predicate.js";

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
export type Add<A extends number, B extends number> = tf.Sum<A, B>;

/**
 * 返回 {@link A} 减去 {@link B} 的结果
 *
 * 注意：
 * - 仅支持数值范围 `-999 ~ 999`
 */
export type Sub<A extends number, B extends number> = tf.Subtract<A, B>;

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
 * 检测值是否为安全整数
 *
 * 与 {@link Number.isSafeInteger} 不同的是，该函数会正确检查 {@link BigInt} 类型的值。
 */
export function isSafeInteger(value: unknown): boolean {
    if (isBigInt(value)) {
        return (
            value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER
        );
    } else {
        return Number.isSafeInteger(value);
    }
}

/**
 * 检测值是否为安全整数
 *
 * 与 {@link Number.isInteger} 不同的是，该函数会正确检查 {@link BigInt} 类型的值。
 */
export function isInteger(value: unknown): boolean {
    if (isBigInt(value)) {
        return true;
    } else {
        return Number.isInteger(value);
    }
}

/**
 * 检测值是否为有限数值
 *
 * 与 {@link Number.isFinite} 不同的是，该函数会正确检查 {@link BigInt} 类型的值。
 */
export function isFinite(value: unknown): boolean {
    if (isBigInt(value)) {
        return true;
    } else {
        return Number.isFinite(value);
    }
}
