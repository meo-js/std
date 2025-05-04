/**
 * @public
 *
 * @module
 */
import {
    isArrayBuffer,
    isBigInt64Array,
    isBigUint64Array,
    isDataView,
    isFloat32Array,
    isFloat64Array,
    isInt16Array,
    isInt32Array,
    isInt8Array,
    isUint16Array,
    isUint32Array,
    isUint8Array,
    isUint8ClampedArray,
} from "./guard.js";

/**
 * 类型化数组
 */
export type TypedArray =
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array
    | Int8Array
    | Int16Array
    | Int32Array
    | BigUint64Array
    | BigInt64Array
    // | Float16Array (unstable)
    | Float32Array
    | Float64Array;

/**
 * 字节序枚举
 */
export enum Endian {
    Unknown = "unknown",
    Little = "le",
    Big = "be",
}

/**
 * {@link BufferSource} 信息
 */
export class BufferInfo {
    /**
     * 用于创建 {@link BufferSource} 的参数
     *
     * @example
     * ```ts
     * const info = getBufferInfo(source);
     * const buffer = new Uint8Array(...info.params);
     * ```
     */
    get params(): [
        buffer: ArrayBufferLike,
        byteOffset: number,
        byteLength: number,
    ] {
        return [this.buffer, this.byteOffset, this.byteLength];
    }

    constructor(
        public buffer: ArrayBufferLike,
        public byteOffset: number,
        public byteLength: number,
    ) {
        this.buffer = buffer;
        this.byteOffset = byteOffset;
        this.byteLength = byteLength;
    }
}

let _platformEndian: Endian | undefined;

/**
 * 将 {@link BufferSource} 转换为 {@link Uint8Array}
 */
export function asUint8Array(v: BufferSource): Uint8Array {
    if (isUint8Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Uint8Array(v);
    }
    return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Uint8ClampedArray}
 */
export function asUint8ClampedArray(v: BufferSource): Uint8ClampedArray {
    if (isUint8ClampedArray(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Uint8ClampedArray(v);
    }
    return new Uint8ClampedArray(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Uint16Array}
 */
export function asUint16Array(v: BufferSource): Uint16Array {
    if (isUint16Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Uint16Array(v);
    }
    return new Uint16Array(v.buffer, v.byteOffset, v.byteLength / 2);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Uint32Array}
 */
export function asUint32Array(v: BufferSource): Uint32Array {
    if (isUint32Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Uint32Array(v);
    }
    return new Uint32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Int8Array}
 */
export function asInt8Array(v: BufferSource): Int8Array {
    if (isInt8Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Int8Array(v);
    }
    return new Int8Array(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Int16Array}
 */
export function asInt16Array(v: BufferSource): Int16Array {
    if (isInt16Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Int16Array(v);
    }
    return new Int16Array(v.buffer, v.byteOffset, v.byteLength / 2);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Int32Array}
 */
export function asInt32Array(v: BufferSource): Int32Array {
    if (isInt32Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Int32Array(v);
    }
    return new Int32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link BufferSource} 转换为 {@link BigUint64Array}
 */
export function asBigUint64Array(v: BufferSource): BigUint64Array {
    if (isBigUint64Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new BigUint64Array(v);
    }
    return new BigUint64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link BufferSource} 转换为 {@link BigInt64Array}
 */
export function asBigInt64Array(v: BufferSource): BigInt64Array {
    if (isBigInt64Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new BigInt64Array(v);
    }
    return new BigInt64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Float32Array}
 */
export function asFloat32Array(v: BufferSource): Float32Array {
    if (isFloat32Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Float32Array(v);
    }
    return new Float32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link BufferSource} 转换为 {@link Float64Array}
 */
export function asFloat64Array(v: BufferSource): Float64Array {
    if (isFloat64Array(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new Float64Array(v);
    }
    return new Float64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link BufferSource} 转换为 {@link DataView}
 */
export function asDataView(v: BufferSource): DataView {
    if (isDataView(v)) {
        return v;
    }
    if (isArrayBuffer(v)) {
        return new DataView(v);
    }
    return new DataView(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 获取 {@link BufferSource} 的信息
 */
export function getBufferInfo(v: BufferSource): BufferInfo {
    if (isArrayBuffer(v)) {
        return new BufferInfo(v, 0, v.byteLength);
    } else {
        return new BufferInfo(v.buffer, v.byteOffset, v.byteLength);
    }
}

/**
 * 获取平台字节序
 */
export function getPlatformEndian(): Endian {
    if (_platformEndian == null) {
        const uInt32 = new Uint32Array([0x11223344]);
        const uInt8 = new Uint8Array(uInt32.buffer);
        if (uInt8[0] === 0x44) {
            _platformEndian = Endian.Little;
        } else if (uInt8[0] === 0x11) {
            _platformEndian = Endian.Big;
        } else {
            _platformEndian = Endian.Unknown;
        }
    }

    return _platformEndian;
}
