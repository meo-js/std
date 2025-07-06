/**
 * @public
 *
 * @module
 */
import { PLATFORM_ENDIAN } from "./env.js";
import { throwUnsignedWithNegative } from "./internal/error.js";
import { bitLength } from "./math.js";
import { isUint8Array } from "./predicate.js";
import { Endian } from "./typed-array.js";

/**
 * {@link Uint8Array} 转为 {@link BigInt} 的选项
 */
export interface FromUint8ArrayOptions {
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
 * {@link BigInt} 转为 {@link Uint8Array} 的选项
 */
export interface ToUint8ArrayOptions extends FromUint8ArrayOptions {
    /**
     * 指定输出位数
     *
     * 注意：
     * - 内部会向上取整为字节数再使用，例如 `53` 位会被向上取整为 `8` 字节（`64` 位）。
     * - 若提供了 `out` 则会忽略该选项，强制使用缓冲区长度
     *
     * @default 若不指定则默认使用 {@link bitLength} 计算最小位数，
     */
    bit?: number;
}

/**
 * 将 {@link BigInt} 转为 {@link Uint8Array}
 *
 * @param value 数值
 * @param opts {@link ToUint8ArrayOptions}
 */
export function toUint8Array(
    value: bigint,
    opts?: ToUint8ArrayOptions,
): Uint8Array;
export function toUint8Array(
    value: bigint,
    out: Uint8Array,
    opts?: ToUint8ArrayOptions,
): Uint8Array;
export function toUint8Array(
    value: bigint,
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

    if (!signed && value < BigInt(0)) {
        throwUnsignedWithNegative("toUint8Array(signed = false)");
    }

    let len = 0;
    let out: Uint8Array;

    if (isUint8Array(arg2)) {
        out = arg2;
        len = bit != null ? Math.ceil(bit / 8) : out.length;
    } else {
        len = Math.ceil(bit ?? bitLength(value, signed) / 8);
        out = new Uint8Array(len);
    }

    if (value === BigInt(0)) {
        return out;
    }

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

/**
 * 将 {@link Uint8Array} 转为 {@link BigInt}
 *
 * @param bytes 字节数组
 * @param opts {@link FromUint8ArrayOptions}
 */
export function fromUint8Array(
    bytes: Uint8Array,
    opts: FromUint8ArrayOptions = {},
): bigint {
    const { littleEndian = PLATFORM_ENDIAN !== Endian.Big, signed = true } =
        opts;

    const len = bytes.length;
    if (len === 0) return BigInt(0);

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
