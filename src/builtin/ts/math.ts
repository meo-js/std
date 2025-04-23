import * as tf from "type-fest";

/**
 * {@link Number.POSITIVE_INFINITY}
 */
export type PositiveInfinity = tf.PositiveInfinity;

/**
 * {@link Number.NEGATIVE_INFINITY}
 */
export type NegativeInfinity = tf.NegativeInfinity;

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
