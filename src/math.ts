/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";
import { PLATFORM_ENDIAN } from "./env.js";
import { throwUnsignedWithNegative } from "./internal/error.js";
import { isBigInt, isNumber, isUint8Array } from "./predicate.js";
import type { And, Not } from "./ts/logical.js";
import { asDataView, Endian } from "./typed-array.js";

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
 * 数值二进制编/解码选项
 */
export interface NumericBinaryOptions {
    /**
     * 指定为小端字节序
     *
     * @default 默认使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
     */
    littleEndian?: boolean;

    /**
     * 是否使用补码
     *
     * @default true
     */
    signed?: boolean;
}

/**
 * {@link Uint8Array} 转为数值的选项
 */
export type FromUint8ArrayOptions = NumericBinaryOptions;

/**
 * 数值转为 {@link Uint8Array} 的选项
 */
export interface ToUint8ArrayOptions extends NumericBinaryOptions {
    /**
     * 指定输出位数
     *
     * 注意：
     * - 内部会向上取整为字节数再使用，例如 `53` 位会被向上取整为 `7` 字节（`56` 位）。
     * - 若提供了 `out` 则会忽略该选项，强制使用缓冲区长度
     *
     * @default 若不指定则默认使用 {@link bitLength} 计算最小位数，
     */
    bit?: number;
}

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

/**
 * 检测值是否能被另一个值整除
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 可以被整除则返回 `true`，否则返回 `false`
 */
export function divisibleBy(dividend: Numeric, divisor: Numeric): boolean {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return BigInt(dividend) % BigInt(divisor) === BigInt(0);
    } else {
        return dividend % divisor === 0;
    }
}

/**
 * 整数除法，返回截断小数的结果
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
 * 整数除法，返回向下取整的结果
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 计算结果
 */
export function fdiv(dividend: number, divisor: number): number;
export function fdiv(dividend: Numeric, divisor: Numeric): bigint;
export function fdiv(dividend: Numeric, divisor: Numeric): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return _div(dividend, divisor, -1);
    } else {
        return Math.floor(dividend / divisor);
    }
}

/**
 * 整数除法，返回向上取整的结果
 *
 * @param dividend 被除数
 * @param divisor 除数
 * @returns 计算结果
 */
export function cdiv(dividend: number, divisor: number): number;
export function cdiv(dividend: Numeric, divisor: Numeric): bigint;
export function cdiv(dividend: Numeric, divisor: Numeric): Numeric {
    if (isBigInt(dividend) || isBigInt(divisor)) {
        return _div(dividend, divisor, 1);
    } else {
        return Math.ceil(dividend / divisor);
    }
}

function _div(dividend: Numeric, divisor: Numeric, plus: number) {
    const a = BigInt(dividend);
    const b = BigInt(divisor);
    const n0 = BigInt(0);
    const n1 = BigInt(plus);
    return a / b + (a % b < n0 ? n1 : n0);
}

/**
 * 计算以 `2` 为底的对数，返回向下取整的结果
 *
 * @param value 必须 >= 0
 */
export function flog2(value: number): number;
export function flog2(value: bigint): bigint;
export function flog2(value: Numeric): Numeric {
    if (value < 0) {
        throwUnsignedWithNegative("flog2()");
    }

    if (isBigInt(value)) {
        return _bitLengthUnsigned(value) - BigInt(1);
    } else {
        if (value === 0) return 0;
        return Math.floor(Math.log2(value));
    }
}

/**
 * 计算以 `2` 为底的对数，返回向上取整的结果
 *
 * @param value 必须 >= 0
 */
export function clog2(value: number): number;
export function clog2(value: bigint): bigint;
export function clog2(value: Numeric): Numeric {
    if (value < 0) {
        throwUnsignedWithNegative("clog2()");
    }

    if (isBigInt(value)) {
        if (value <= BigInt(1)) return BigInt(0);

        const bits = _bitLengthUnsigned(value);
        // 如果恰好是 2 的幂，则不需要再 +1
        return (value & (value - BigInt(1))) === BigInt(0)
            ? bits - BigInt(1)
            : bits;
    } else {
        if (value <= 1) return 0;
        return Math.ceil(Math.log2(value));
    }
}

/**
 * @param value 必须 >= 0
 * @returns 返回 {@link value} 的二进制位长度，如果是 `0`，则返回 `1`
 */
function _bitLengthUnsigned(value: bigint): bigint {
    if (value === BigInt(0)) return BigInt(1);

    let bits = BigInt(0);

    // 先逐步右移，直到剩余的值小于 STEP 位，减少循环次数以提高效率
    const STEP = BigInt(32);
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

/**
 * 传入一个整数，返回足以存储该值的最小二进制位数
 *
 * @param value 数值
 * @param signed 是否返回补码的位宽，默认为 `true`
 */
export function bitLength(value: Numeric, signed: boolean = true): number {
    const v = typeof value === "bigint" ? value : BigInt(value);

    if (!signed) {
        if (v < BigInt(0)) {
            throwUnsignedWithNegative("bitLength(signed = false)");
        }
        return Number(_bitLengthUnsigned(v));
    }

    if (v >= BigInt(0)) {
        // 检测最高有效位 (MSB) 是否为 1；若是 1，就再加一位做符号位，否则保持不变
        const bits = _bitLengthUnsigned(v);
        const needExtra = (v & (BigInt(1) << (bits - BigInt(1)))) !== BigInt(0);
        return Number(bits + (needExtra ? BigInt(1) : BigInt(0)));
    } else {
        // 位宽需满足 v >= -2^(bits-1)
        const m = -v;
        const bits =
            _bitLengthUnsigned(m)
            + ((m & (m - BigInt(1))) === BigInt(0) ? BigInt(0) : BigInt(1));
        return Number(bits);
    }
}

/**
 * 返回指定位数的最大整数值
 *
 * @param bits 位数
 * @param signed 是否使用补码，默认为 `true`
 * @returns 最大整数值
 */
export function maxIntOfBits(bits: number, signed: boolean = true): bigint {
    const b = BigInt(bits);
    return signed
        ? (BigInt(1) << (b - BigInt(1))) - BigInt(1)
        : (BigInt(1) << b) - BigInt(1);
}

/**
 * 返回指定位数的最小整数值
 *
 * @param bits 位数
 * @param signed 是否使用补码，默认为 `true`
 * @returns 最小整数值，如果不使用补码会直接返回 `0`
 */
export function minIntOfBits(bits: number, signed: boolean = true): bigint {
    const b = BigInt(bits);
    return signed ? -(BigInt(1) << (b - BigInt(1))) : BigInt(0);
}

function _asUintNumber(bits: number, value: Numeric): number {
    return isNumber(value) ? value : Number(BigInt.asUintN(bits, value));
}

function _fastToUint8Array(
    value: Numeric,
    len: number,
    littleEndian: boolean,
    out: Uint8Array,
) {
    const view = asDataView(out);
    switch (len) {
        case 1:
            view.setUint8(0, _asUintNumber(8, value));
            return true;

        case 2:
            view.setUint16(0, _asUintNumber(16, value), littleEndian);
            return true;

        case 4:
            view.setUint32(0, _asUintNumber(32, value), littleEndian);
            return true;

        case 8:
            view.setBigUint64(0, BigInt(value), littleEndian);
            return true;

        default:
            return false;
    }
}

function _bigIntToUint8Array(
    value: bigint,
    len: number,
    littleEndian: boolean,
    out: Uint8Array,
): Uint8Array {
    let v = value;
    if (v < BigInt(0)) {
        // 转为补码
        const mod = BigInt(1) << BigInt(len * 8);
        v = (mod + v) & (mod - BigInt(1));
    }

    let tmp = v;

    if (littleEndian) {
        for (let i = 0; i < len; i++) {
            out[i] = Number(tmp & BigInt(0xff));
            tmp >>= BigInt(8);
        }
    } else {
        for (let i = 0; i < len; i++) {
            out[len - 1 - i] = Number(tmp & BigInt(0xff));
            tmp >>= BigInt(8);
        }
    }

    if (tmp !== BigInt(0)) {
        throw new RangeError(`${value} cannot fit in ${len} bytes.`);
    }

    return out;
}

function _fastFromUint8Array(
    bytes: Uint8Array,
    littleEndian: boolean,
    signed: boolean,
): Numeric | null {
    const len = bytes.length;
    const view = asDataView(bytes);

    switch (len) {
        case 1:
            return signed ? view.getInt8(0) : view.getUint8(0);

        case 2:
            return signed
                ? view.getInt16(0, littleEndian)
                : view.getUint16(0, littleEndian);

        case 4:
            return signed
                ? view.getInt32(0, littleEndian)
                : view.getUint32(0, littleEndian);

        case 8:
            return signed
                ? view.getBigInt64(0, littleEndian)
                : view.getBigUint64(0, littleEndian);

        default:
            return null;
    }
}

function _bigIntfromUint8Array(
    bytes: Uint8Array,
    littleEndian: boolean,
    signed: boolean,
): bigint {
    const len = bytes.length;
    let value = BigInt(0);

    if (littleEndian) {
        for (let i = len - 1; i >= 0; i--) {
            value = (value << BigInt(8)) | BigInt(bytes[i]);
        }
    } else {
        for (let i = 0; i < len; i++) {
            value = (value << BigInt(8)) | BigInt(bytes[i]);
        }
    }

    // 若按补码解释且符号位为 1，则转换为负数
    if (signed) {
        const bitLen = BigInt(len * 8);
        const signBit = BigInt(1) << (bitLen - BigInt(1));
        if ((value & signBit) !== BigInt(0)) {
            // 按补码规则还原
            value = value - (BigInt(1) << bitLen);
        }
    }

    return value;
}

/**
 * 将数值转为 {@link Uint8Array}
 *
 * @param value 数值
 * @param opts {@link ToUint8ArrayOptions}
 */
export function toUint8Array(
    value: Numeric,
    opts?: ToUint8ArrayOptions,
): Uint8Array;
export function toUint8Array(
    value: Numeric,
    out: Uint8Array,
    opts?: ToUint8ArrayOptions,
): Uint8Array;
export function toUint8Array(
    value: Numeric,
    arg2?: Uint8Array | ToUint8ArrayOptions,
    opts?: ToUint8ArrayOptions,
): Uint8Array {
    if (!isUint8Array(arg2)) {
        opts = arg2;
    }

    const {
        bit,
        littleEndian = PLATFORM_ENDIAN !== Endian.Big,
        signed = true,
    } = opts ?? {};

    if (!signed && value < 0) {
        throwUnsignedWithNegative("toUint8Array(signed = false)");
    }

    let len = 0;
    let out: Uint8Array;
    const hasOut = isUint8Array(arg2);

    if (hasOut) {
        out = arg2;
        len = bit != null ? Math.ceil(bit / 8) : out.length;
    } else {
        len = Math.ceil((bit ?? bitLength(value, signed)) / 8);
        out = new Uint8Array(len);
    }

    if (value === 0) {
        if (hasOut) {
            out.fill(0);
        }
        return out;
    }

    if (isNumber(value)) {
        value = Math.trunc(value);
    }

    if (_fastToUint8Array(value, len, littleEndian, out)) {
        return out;
    }

    return _bigIntToUint8Array(BigInt(value), len, littleEndian, out);
}

/**
 * 将 {@link Uint8Array} 转为数值
 *
 * @param bytes 字节数组
 * @param opts {@link FromUint8ArrayOptions}
 */
export function fromUint8Array(
    bytes: Uint8Array,
    opts: FromUint8ArrayOptions = {},
): Numeric {
    const { littleEndian = PLATFORM_ENDIAN !== Endian.Big, signed = true } =
        opts;

    if (bytes.length === 0) return 0;

    const result = _fastFromUint8Array(bytes, littleEndian, signed);
    if (result !== null) {
        return result;
    }

    return _bigIntfromUint8Array(bytes, littleEndian, signed);
}
