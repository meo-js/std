/**
 * @public
 *
 * @module
 */
import { assertPositive } from "../internal/error.js";
import { isBigInt } from "../predicate.js";
import { Rounding } from "./float.js";
import type { Numeric } from "./general.js";

/**
 * 计算数值的绝对值
 *
 * @param value 数值
 * @returns 绝对值
 */
export function abs(value: number): number;
export function abs(value: bigint): bigint;
export function abs(value: Numeric): Numeric {
    if (isBigInt(value)) {
        return value >= 0n ? value : -value;
    } else {
        return Math.abs(value);
    }
}

/**
 * 数值除法，返回舍入的结果。
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @param rounding {@link Rounding}，默认 {@link Rounding.HalfUp}
 * @returns 计算结果
 */
export function div(
    dividend: number,
    divisor: number,
    rounding?: Rounding,
): number;
export function div(
    dividend: Numeric,
    divisor: Numeric,
    rounding?: Rounding,
): bigint;
export function div(
    dividend: Numeric,
    divisor: Numeric,
    rounding: Rounding = Rounding.HalfUp,
): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return _divWith(BigInt(dividend), BigInt(divisor), rounding);
    } else {
        return dividend / divisor;
    }
}

/**
 * 数值除法，返回截断小数的结果
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 计算结果
 */
export function idiv(dividend: number, divisor: number): number;
export function idiv(dividend: Numeric, divisor: Numeric): bigint;
export function idiv(dividend: Numeric, divisor: Numeric): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return BigInt(dividend) / BigInt(divisor);
    } else {
        return Math.trunc(dividend / divisor);
    }
}

/**
 * 数值除法，返回向下取整的结果
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 计算结果
 */
export function fdiv(dividend: number, divisor: number): number;
export function fdiv(dividend: Numeric, divisor: Numeric): bigint;
export function fdiv(dividend: Numeric, divisor: Numeric): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return _div(BigInt(dividend), BigInt(divisor), false);
    } else {
        return Math.floor(dividend / divisor);
    }
}

/**
 * 数值除法，返回向上取整的结果
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 计算结果
 */
export function cdiv(dividend: number, divisor: number): number;
export function cdiv(dividend: Numeric, divisor: Numeric): bigint;
export function cdiv(dividend: Numeric, divisor: Numeric): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return _div(BigInt(dividend), BigInt(divisor), true);
    } else {
        return Math.ceil(dividend / divisor);
    }
}

function _divWith(a: bigint, b: bigint, rounding: Rounding): bigint {
    const quotient = a / b;
    const remainder = a % b;

    if (remainder === 0n) {
        return quotient;
    }

    const absA = abs(a);
    const absB = abs(b);
    const absRemainder = absA % absB;
    const absRemainderDoubled = absRemainder * 2n;
    const sameSign = a > 0n === b > 0n;

    switch (rounding) {
        case Rounding.ToZero:
            return quotient;

        case Rounding.AwayFromZero:
            return quotient + (sameSign ? 1n : -1n);

        case Rounding.HalfDown:
            return (
                quotient
                + (absRemainderDoubled < absB ? 0n : sameSign ? 0n : -1n)
            );

        case Rounding.HalfUp:
            return (
                quotient
                + (absRemainderDoubled < absB ? 0n : sameSign ? 1n : 0n)
            );

        case Rounding.ToEven:
            return (
                quotient
                + (absRemainderDoubled < absB
                || (absRemainderDoubled === absB && quotient % 2n === 0n)
                    ? 0n
                    : sameSign
                      ? 1n
                      : -1n)
            );
    }
}

function _div(a: bigint, b: bigint, isCeil: boolean) {
    const quotient = a / b;
    const remainder = a % b;

    if (remainder === 0n) {
        return quotient;
    }

    if (isCeil) {
        return quotient + (a > 0n === b > 0n ? 1n : 0n);
    } else {
        return quotient + (a > 0n === b > 0n ? 0n : -1n);
    }
}

/**
 * 计算以 `2` 为底的对数，返回截断小数的结果
 *
 * @param value 必须 > 0
 */
export function ilog2(value: number): number;
export function ilog2(value: bigint): bigint;
export function ilog2(value: Numeric): Numeric {
    assertPositive(value, true);

    if (isBigInt(value)) {
        return bitLengthPositive(value) - BigInt(1);
    } else {
        return Math.floor(Math.log2(value));
    }
}

/**
 * 计算以 `2` 为底的对数，返回向下取整的结果
 *
 * @param value 必须 > 0
 */
export function flog2(value: number): number;
export function flog2(value: bigint): bigint;
export function flog2(value: Numeric): Numeric {
    assertPositive(value, true);

    if (isBigInt(value)) {
        return bitLengthPositive(value) - BigInt(1);
    } else {
        return Math.floor(Math.log2(value));
    }
}

/**
 * 计算以 `2` 为底的对数，返回向上取整的结果
 *
 * @param value 必须 > 0
 */
export function clog2(value: number): number;
export function clog2(value: bigint): bigint;
export function clog2(value: Numeric): Numeric {
    assertPositive(value, true);

    if (isBigInt(value)) {
        const k = ilog2(value);
        return (value & (value - BigInt(1))) === BigInt(0) ? k : k + BigInt(1);
    } else {
        return Math.ceil(Math.log2(value));
    }
}

/**
 * 计算以 `2` 为底的对数，返回四舍五入的结果
 *
 * @param value 必须 > 0
 */
export function log2(value: number): number;
export function log2(value: bigint): bigint;
export function log2(value: Numeric): Numeric {
    assertPositive(value, true);

    if (isBigInt(value)) {
        const k = ilog2(value);
        const low = BigInt(1) << k;
        const high = low << BigInt(1);
        const distLow = value - low;
        const distHigh = high - value;

        return distHigh < distLow ? k + BigInt(1) : k;
    } else {
        return Math.round(Math.log2(value));
    }
}

/**
 * @param value 必须 > 0
 * @returns 返回 {@link value} 的二进制位长度
 *
 * @internal
 */
export function bitLengthPositive(value: bigint): bigint {
    const STEP = BigInt(32);
    let bits = BigInt(0);

    // 先逐步右移，直到剩余的值小于 STEP 位，减少循环次数以提高效率
    while (value >> STEP) {
        value >>= STEP;
        bits += STEP;
    }

    // 最后逐 bit 统计剩余高位
    while (value) {
        value >>= BigInt(1);
        bits++;
    }

    return bits;
}
