/**
 * @public
 * @module
 */
import { PLATFORM_ENDIAN } from './env.js';
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
} from './predicate.js';

/**
 * 字节序枚举
 */
export enum Endian {
  Platform = 'platform',
  Little = 'le',
  Big = 'be',
}

/**
 * 类似 {@link BufferSource}，但允许 {@link ArrayBufferLike}
 */
export type AnyBufferSource = ArrayBufferView | ArrayBuffer;

/**
 * 类型化数组
 */
export type TypedArray<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> =

    | Uint8Array<TArrayBuffer>
    | Uint8ClampedArray<TArrayBuffer>
    | Uint16Array<TArrayBuffer>
    | Uint32Array<TArrayBuffer>
    | Int8Array<TArrayBuffer>
    | Int16Array<TArrayBuffer>
    | Int32Array<TArrayBuffer>
    | BigUint64Array<TArrayBuffer>
    | BigInt64Array<TArrayBuffer>
    // | Float16Array (unstable)
    | Float32Array<TArrayBuffer>
    | Float64Array<TArrayBuffer>;

/**
 * 存储 `number` 类型数值的类型化数组
 */
export type NumberTypedArray<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> = Exclude<TypedArray<TArrayBuffer>, BigIntTypedArray<TArrayBuffer>>;

/**
 * 存储 `bigint` 类型数值的类型化数组
 */
export type BigIntTypedArray<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> = BigUint64Array<TArrayBuffer> | BigInt64Array<TArrayBuffer>;

/**
 * {@link ArrayBufferView} 构造函数类型
 */
export type ArrayBufferViewConstructor<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> = new (
  buffer: TArrayBuffer & { BYTES_PER_ELEMENT?: never },
  byteOffset?: number,
  byteLength?: number,
) => TypedArray | DataView;

/**
 * {@link ArrayBufferViewConstructor} 的实例类型
 *
 * 使用该类型解决直接使用 TypeScript 内置的 {@link InstanceType} 无法得到正确的 `TArrayBuffer` 泛型的问题。
 */
export type ArrayBufferViewConstructorInstanceOf<
  T extends ArrayBufferViewConstructor = ArrayBufferViewConstructor,
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> = T extends Uint8ArrayConstructor ? Uint8Array<TArrayBuffer> : never;

/**
 * {@link AnyBufferSource} 信息
 */
export class BufferInfo {
  /**
   * 用于创建 {@link AnyBufferSource} 的参数
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

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Uint8Array}
 */
export function asUint8Array(v: AnyBufferSource): Uint8Array {
  if (isUint8Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Uint8Array(v);
  }
  return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Uint8ClampedArray}
 */
export function asUint8ClampedArray(v: AnyBufferSource): Uint8ClampedArray {
  if (isUint8ClampedArray(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Uint8ClampedArray(v);
  }
  return new Uint8ClampedArray(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Uint16Array}
 */
export function asUint16Array(v: AnyBufferSource): Uint16Array {
  if (isUint16Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Uint16Array(v);
  }
  return new Uint16Array(v.buffer, v.byteOffset, v.byteLength / 2);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Uint32Array}
 */
export function asUint32Array(v: AnyBufferSource): Uint32Array {
  if (isUint32Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Uint32Array(v);
  }
  return new Uint32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Int8Array}
 */
export function asInt8Array(v: AnyBufferSource): Int8Array {
  if (isInt8Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Int8Array(v);
  }
  return new Int8Array(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Int16Array}
 */
export function asInt16Array(v: AnyBufferSource): Int16Array {
  if (isInt16Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Int16Array(v);
  }
  return new Int16Array(v.buffer, v.byteOffset, v.byteLength / 2);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Int32Array}
 */
export function asInt32Array(v: AnyBufferSource): Int32Array {
  if (isInt32Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Int32Array(v);
  }
  return new Int32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link BigUint64Array}
 */
export function asBigUint64Array(v: AnyBufferSource): BigUint64Array {
  if (isBigUint64Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new BigUint64Array(v);
  }
  return new BigUint64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link BigInt64Array}
 */
export function asBigInt64Array(v: AnyBufferSource): BigInt64Array {
  if (isBigInt64Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new BigInt64Array(v);
  }
  return new BigInt64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Float32Array}
 */
export function asFloat32Array(v: AnyBufferSource): Float32Array {
  if (isFloat32Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Float32Array(v);
  }
  return new Float32Array(v.buffer, v.byteOffset, v.byteLength / 4);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link Float64Array}
 */
export function asFloat64Array(v: AnyBufferSource): Float64Array {
  if (isFloat64Array(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new Float64Array(v);
  }
  return new Float64Array(v.buffer, v.byteOffset, v.byteLength / 8);
}

/**
 * 将 {@link AnyBufferSource} 转换为 {@link DataView}
 */
export function asDataView(v: AnyBufferSource): DataView {
  if (isDataView(v)) {
    return v;
  }
  if (isArrayBuffer(v)) {
    return new DataView(v);
  }
  return new DataView(v.buffer, v.byteOffset, v.byteLength);
}

/**
 * 获取 {@link AnyBufferSource} 的信息
 */
export function getBufferInfo(v: AnyBufferSource): BufferInfo {
  if (isArrayBuffer(v)) {
    return new BufferInfo(v, 0, v.byteLength);
  } else {
    return new BufferInfo(v.buffer, v.byteOffset, v.byteLength);
  }
}

/**
 * 检测传入的字节序是否为平台字节序
 *
 * @param endian 字节序
 * @returns `boolean`
 */
export function isPlatformEndian(endian: Endian): boolean {
  return endian === Endian.Platform || endian === PLATFORM_ENDIAN;
}

/**
 * 标准化字节序的输入
 *
 * 该函数用于解决当用户传入 {@link Endian.Platform} 时无法确定是使用平台字节序还是平台字节序是特殊字节序的问题。
 *
 * @returns 若输入的是 {@link Endian.Platform} 或 `undefined`，则返回 {@link PLATFORM_ENDIAN}，否则返回原值
 */
export function normalizeEndian(endian: Endian = PLATFORM_ENDIAN): Endian {
  if (endian === Endian.Platform) {
    return PLATFORM_ENDIAN;
  } else {
    return endian;
  }
}
