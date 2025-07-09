/**
 * @module
 *
 * @internal
 */
import { utf8 } from "../encoding/text.js";
import { PLATFORM_ENDIAN } from "../env.js";
import type { fn } from "../function.js";
import type { PickValue, ValueOf } from "../object.js";
import { forEach, Pipe } from "../pipe.js";
import { flatCodePoints } from "../pipe/string.js";
import {
    isArrayBufferView,
    isBigInt64Array,
    isBigUint64Array,
    isFloat32Array,
    isFloat64Array,
    isFunction,
    isInt16Array,
    isInt32Array,
    isString,
    isUint16Array,
    isUint32Array,
} from "../predicate.js";
import { getStringTag } from "../primitive.js";
import type { checked } from "../ts.js";
import {
    asDataView,
    Endian,
    isPlatformEndian,
    type BigIntTypedArray,
    type NumberTypedArray,
    type TypedArray,
} from "../typed-array.js";

/**
 * 任意字节类数据视图
 */
export type AnyBytes = Bytes | BigIntBytes;

/**
 * 允许转换为字节类数据视图的类型
 */
export type BytesLike = string | TypedArray | AnyBytes;

/**
 * 字节类数据视图接口
 */
export interface Bytes {
    /**
     * 每个元素的字节数
     */
    get BYTES_PER_ELEMENT(): number;

    /**
     * 元素长度
     */
    get length(): number;

    /**
     * 字节长度
     */
    get byteLength(): number;

    /**
     * 字节序
     */
    get endian(): Endian;

    /**
     * 获取指定索引的元素
     */
    at(index: number): number;

    /**
     * 设置指定索引的元素
     */
    set(index: number, value: number): void;

    /**
     * 遍历每个元素，为每个元素调用一次回调函数
     */
    forEach(
        callbackfn: (value: number, index: number) => void | boolean,
        thisArg?: unknown,
    ): void;
}

/**
 * BigInt 字节类数据视图接口
 */
export interface BigIntBytes {
    /**
     * 每个元素的字节数
     */
    get BYTES_PER_ELEMENT(): number;

    /**
     * 元素长度
     */
    get length(): number;

    /**
     * 字节长度
     */
    get byteLength(): number;

    /**
     * 字节序
     */
    get endian(): Endian;

    /**
     * 获取指定索引的元素
     */
    at(index: number): bigint;

    /**
     * 设置指定索引的元素
     */
    set(index: number, value: bigint): void;

    /**
     * 遍历每个元素，为每个元素调用一次回调函数
     */
    forEach(
        callbackfn: (value: bigint, index: number) => void | boolean,
        thisArg?: unknown,
    ): void;
}

interface BytesImpl {
    /**
     * 每个元素的字节数
     */
    get BYTES_PER_ELEMENT(): number;

    /**
     * 元素长度
     */
    get length(): number;

    /**
     * 字节长度
     */
    get byteLength(): number;

    /**
     * 字节序
     */
    get endian(): Endian;

    /**
     * 获取指定索引的元素
     */
    at(index: number): number | bigint;

    /**
     * 设置指定索引的元素
     */
    set(index: number, value: number | bigint): void;

    /**
     * 遍历每个元素，为每个元素调用一次回调函数
     */
    forEach(
        callbackfn: (value: number | bigint, index: number) => void | boolean,
        thisArg?: unknown,
    ): void;
}

export namespace Bytes {
    /**
     * 字节类数据视图选项
     */
    export interface Options {
        /**
         * 是否使用 UTF-8 编码处理字符串
         *
         * 仅影响对字符串数据的处理。
         *
         * @default true
         */
        utf8?: boolean;

        /**
         * 是否添加 BOM
         *
         * 仅影响对字符串数据的处理。
         *
         * @default 若编码规范要求则默认添加 BOM，否则不添加
         */
        bom?: boolean;

        /**
         * 遇到无效数据时是否直接抛出错误，否则将使用替换字符（Unicode 为 `0xFFFD`，其它为 `0x1A`）替代
         *
         * 仅影响对字符串数据的处理。
         *
         * @default false
         */
        fatal?: boolean;

        /**
         * 指定视图使用的字节序
         *
         * @default 默认使用平台字节序
         */
        endian?: Endian;
    }

    /**
     * {@link forEach} 回调函数类型
     */
    export type Callback<T extends number | bigint> = (
        value: T,
        index: number,
    ) => void | boolean;

    /**
     * 根据类型返回 {@link forEach} 回调函数类型
     */
    export type ToCallback<T extends BytesLike> = T extends BigIntTypedArray
        ? Callback<bigint>
        : T extends NumberTypedArray
          ? Callback<number>
          : T extends string
            ? Callback<number>
            : T extends Bytes
              ? Callback<number>
              : T extends BigIntBytes
                ? Callback<bigint>
                : never;

    /**
     * 根据类型返回 {@link Bytes} 或 {@link BigIntBytes} 类型
     */
    export type From<T extends BytesLike> = T extends AnyBytes
        ? T
        : T extends BigIntTypedArray
          ? BigIntBytes
          : T extends NumberTypedArray
            ? Bytes
            : T extends string
              ? Bytes
              : never;

    /**
     * 创建字节类数据视图
     */
    export function from<T extends BytesLike>(
        data: T,
        opts: Options = {},
    ): From<T> {
        const {
            bom = false,
            fatal = false,
            utf8 = true,
            endian = PLATFORM_ENDIAN,
        } = opts;
        if (isString(data)) {
            if (utf8) {
                return new StringWithUtf8Bytes(data, bom, fatal) as checked;
            } else {
                return new StringBytes(data) as checked;
            }
        } else if (isArrayBufferView(data)) {
            if (isPlatformEndian(endian) || data.BYTES_PER_ELEMENT === 1) {
                return new TypedArrayBytes(data) as checked;
            } else {
                const little = endian === Endian.Little;

                if (isUint16Array(data)) {
                    return new Uint16DataViewBytes(data, little) as checked;
                } else if (isUint32Array(data)) {
                    return new Uint32DataViewBytes(data, little) as checked;
                } else if (isBigUint64Array(data)) {
                    return new BigUint64DataViewBytes(data, little) as checked;
                } else if (isInt16Array(data)) {
                    return new Int16DataViewBytes(data, little) as checked;
                } else if (isInt32Array(data)) {
                    return new Int32DataViewBytes(data, little) as checked;
                } else if (isBigInt64Array(data)) {
                    return new BigInt64DataViewBytes(data, little) as checked;
                } else if (isFloat32Array(data)) {
                    return new Float32DataViewBytes(data, little) as checked;
                } else if (isFloat64Array(data)) {
                    return new Float64DataViewBytes(data, little) as checked;
                } else {
                    throw new TypeError(
                        `unsupported TypedArray type: ${getStringTag(data)}`,
                    );
                }
            }
        } else {
            // 已经是 Bytes 实例
            return data as checked;
        }
    }

    /**
     * 遍历字节类数据，为每个元素调用一次回调函数
     */
    export function forEach<T extends BytesLike>(
        data: T,
        opts: Options,
        callbackfn: NoInfer<ToCallback<T>>,
        thisArg?: unknown,
    ): void;
    export function forEach<T extends BytesLike>(
        data: T,
        callbackfn: NoInfer<ToCallback<T>>,
        thisArg?: unknown,
    ): void;
    export function forEach<T extends BytesLike>(
        data: T,
        arg1: Options | fn = {},
        arg2?: unknown,
        arg3?: unknown,
    ): void {
        let opts: Options;
        let callbackfn: fn;
        let thisArg: unknown;

        if (isFunction(arg1)) {
            opts = {};
            callbackfn = arg1;
            thisArg = arg2;
        } else {
            opts = arg1;
            callbackfn = arg2 as fn;
            thisArg = arg3;
        }

        if (isString(data)) {
            const { bom = false, fatal = false, utf8 = true } = opts;
            if (utf8) {
                forEachStringWithUtf8(
                    data,
                    bom,
                    fatal,
                    callbackfn as checked,
                    thisArg,
                );
            } else {
                forEachString(data, callbackfn as checked, thisArg);
            }
        } else if (isArrayBufferView(data)) {
            const { endian = PLATFORM_ENDIAN } = opts;
            if (isPlatformEndian(endian) || data.BYTES_PER_ELEMENT === 1) {
                forEachTypedArray(data, callbackfn as checked, thisArg);
            } else {
                const little = endian === Endian.Little;

                if (isUint16Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getUint16,
                        Uint16Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isUint32Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getUint32,
                        Uint32Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isBigUint64Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getBigUint64,
                        BigUint64Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isInt16Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getInt16,
                        Int16Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isInt32Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getInt32,
                        Int32Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isBigInt64Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getBigInt64,
                        BigInt64Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isFloat32Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getFloat32,
                        Float32Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else if (isFloat64Array(data)) {
                    forEachDataView(
                        asDataView(data),
                        getFloat64,
                        Float64Array.BYTES_PER_ELEMENT,
                        little,
                        callbackfn as checked,
                        thisArg,
                    );
                } else {
                    throw new TypeError(
                        `unsupported TypedArray type: ${getStringTag(data)}`,
                    );
                }
            }
        } else {
            // 已经是 Bytes 实例
            data.forEach(callbackfn as checked, thisArg);
        }
    }
}

function forEachStringWithUtf8(
    text: string,
    bom: boolean,
    fatal: boolean,
    callbackfn: (value: number, index: number) => void | boolean,
    thisArg?: unknown,
) {
    Pipe.run(
        text,
        flatCodePoints(),
        utf8.encodePipe({ bom, fatal }),
        forEach(callbackfn, thisArg),
    );
}

function forEachString(
    text: string,
    callbackfn: (value: number, index: number) => void | boolean,
    thisArg?: unknown,
) {
    for (let i = 0; i < text.length; i++) {
        const result = callbackfn.call(thisArg, text.charCodeAt(i), i);
        if (result === false) {
            break;
        }
    }
}

function forEachTypedArray(
    bytes: TypedArray,
    callbackfn: (value: number | bigint, index: number) => void | boolean,
    thisArg?: unknown,
) {
    for (let i = 0; i < bytes.length; i++) {
        const result = callbackfn.call(thisArg, bytes[i], i);
        if (result === false) {
            break;
        }
    }
}

function forEachDataView(
    bytes: DataView,
    get: DataViewFunction,
    unit: number,
    little: boolean,
    callbackfn: (value: number | bigint, index: number) => void | boolean,
    thisArg?: unknown,
) {
    let i = 0;
    while (i < bytes.byteLength) {
        const result = callbackfn.call(
            thisArg,
            (<DataViewGetter>get).call(bytes, i, little),
            i,
        );
        if (result === false) {
            break;
        }
        i += unit;
    }
}

class StringBytes implements BytesImpl {
    private data: string;

    /**
     * @inheritdoc
     */
    get BYTES_PER_ELEMENT(): number {
        return 2;
    }

    /**
     * @inheritdoc
     */
    get length(): number {
        return this.data.length;
    }

    /**
     * @inheritdoc
     */
    get byteLength(): number {
        return this.length * this.BYTES_PER_ELEMENT;
    }

    /**
     * @inheritdoc
     */
    get endian(): Endian {
        return PLATFORM_ENDIAN;
    }

    constructor(data: string) {
        this.data = data;
    }

    /**
     * @inheritdoc
     */
    forEach(
        callbackfn: (value: number, index: number) => void | boolean,
        thisArg?: unknown,
    ): void {
        forEachString(this.data, callbackfn, thisArg);
    }

    /**
     * @inheritdoc
     */
    at(index: number): number {
        return this.data.charCodeAt(index);
    }

    /**
     * @inheritdoc
     */
    set(index: number, value: number): void {
        this.data =
            this.data.slice(0, index)
            + String.fromCharCode(value)
            + this.data.slice(index + 1);
    }
}

class StringWithUtf8Bytes implements BytesImpl {
    private data: string | Uint8Array;
    private bom: boolean = false;
    private fatal: boolean = false;

    /**
     * @inheritdoc
     */
    get BYTES_PER_ELEMENT(): number {
        return 1;
    }

    /**
     * @inheritdoc
     */
    get length(): number {
        if (isString(this.data)) {
            this.convertToBuffer();
        }
        return (this.data as Uint8Array).length;
    }

    /**
     * @inheritdoc
     */
    get byteLength(): number {
        return this.length * this.BYTES_PER_ELEMENT;
    }

    /**
     * @inheritdoc
     */
    get endian(): Endian {
        return PLATFORM_ENDIAN;
    }

    constructor(data: string, bom: boolean, fatal: boolean) {
        this.data = data;
        this.bom = bom;
        this.fatal = fatal;
    }

    /**
     * @inheritdoc
     */
    forEach(
        callbackfn: (value: number, index: number) => void | boolean,
        thisArg?: unknown,
    ): void {
        if (isString(this.data)) {
            forEachStringWithUtf8(
                this.data,
                this.bom,
                this.fatal,
                callbackfn,
                thisArg,
            );
        } else {
            forEachTypedArray(this.data, callbackfn as checked, thisArg);
        }
    }

    private convertToBuffer() {
        this.data = utf8.encode(this.data as string, {
            bom: this.bom,
            fatal: this.fatal,
        });
    }

    /**
     * @inheritdoc
     */
    at(index: number): number {
        if (isString(this.data)) {
            this.convertToBuffer();
        }
        return (this.data as Uint8Array)[index];
    }

    /**
     * @inheritdoc
     */
    set(index: number, value: number): void {
        if (isString(this.data)) {
            this.convertToBuffer();
        }
        (this.data as Uint8Array)[index] = value;
    }
}

class TypedArrayBytes<T extends TypedArray> implements BytesImpl {
    private data: T;

    /**
     * @inheritdoc
     */
    get BYTES_PER_ELEMENT(): number {
        return this.data.BYTES_PER_ELEMENT;
    }

    /**
     * @inheritdoc
     */
    get length(): number {
        return this.data.length;
    }

    /**
     * @inheritdoc
     */
    get byteLength(): number {
        return this.data.byteLength;
    }

    /**
     * @inheritdoc
     */
    get endian(): Endian {
        return PLATFORM_ENDIAN;
    }

    constructor(data: T) {
        this.data = data;
    }

    /**
     * @inheritdoc
     */
    forEach(
        callbackfn: (value: number | bigint, index: number) => void | boolean,
        thisArg?: unknown,
    ): void {
        forEachTypedArray(this.data, callbackfn, thisArg);
    }

    /**
     * @inheritdoc
     */
    at(index: number): number | bigint {
        return this.data[index];
    }

    /**
     * @inheritdoc
     */
    set(index: number, value: number | bigint): void {
        this.data[index] = value;
    }
}

const {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getBigInt64,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setBigInt64,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getBigUint64,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setBigUint64,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getUint16,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setUint16,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getUint32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setUint32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getInt16,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setInt16,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getInt32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setInt32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getFloat32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setFloat32,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    getFloat64,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- checked.
    setFloat64,
} = DataView.prototype;

type DataViewGetter = fn<
    [byteOffset: number, littleEndian?: boolean],
    number | bigint
>;

type DataViewSetter = fn<
    [byteOffset: number, value: number | bigint, littleEndian?: boolean],
    void
>;

type DataViewFunction = ValueOf<PickValue<typeof DataView.prototype, fn>>;

function createDataViewClass(
    unit: number,
    get: DataViewFunction,
    set: DataViewFunction,
) {
    return class DataViewBytes implements BytesImpl {
        private data: TypedArray;
        private view: DataView;
        private little: boolean;

        /**
         * @inheritdoc
         */
        get BYTES_PER_ELEMENT(): number {
            return this.data.BYTES_PER_ELEMENT;
        }

        /**
         * @inheritdoc
         */
        get length(): number {
            return this.data.length;
        }

        /**
         * @inheritdoc
         */
        get byteLength(): number {
            return this.data.byteLength;
        }

        /**
         * @inheritdoc
         */
        get endian(): Endian {
            return this.little ? Endian.Little : Endian.Big;
        }

        constructor(data: TypedArray, little: boolean) {
            this.data = data;
            this.little = little;
            this.view = asDataView(data);
        }

        /**
         * @inheritdoc
         */
        forEach(
            callbackfn: (
                value: number | bigint,
                index: number,
            ) => void | boolean,
            thisArg?: unknown,
        ): void {
            forEachDataView(
                this.view,
                get,
                unit,
                this.little,
                callbackfn,
                thisArg,
            );
        }

        /**
         * @inheritdoc
         */
        at(index: number): number | bigint {
            return (<DataViewGetter>get).call(this.view, index, this.little);
        }

        /**
         * @inheritdoc
         */
        set(index: number, value: number | bigint): void {
            (<DataViewSetter>set).call(this.view, index, value, this.little);
        }
    };
}

const Uint16DataViewBytes = createDataViewClass(
    Uint16Array.BYTES_PER_ELEMENT,
    getUint16,
    setUint16,
);

const Uint32DataViewBytes = createDataViewClass(
    Uint32Array.BYTES_PER_ELEMENT,
    getUint32,
    setUint32,
);

const BigUint64DataViewBytes = createDataViewClass(
    BigUint64Array.BYTES_PER_ELEMENT,
    getBigUint64,
    setBigUint64,
);

const Int16DataViewBytes = createDataViewClass(
    Int16Array.BYTES_PER_ELEMENT,
    getInt16,
    setInt16,
);

const Int32DataViewBytes = createDataViewClass(
    Int32Array.BYTES_PER_ELEMENT,
    getInt32,
    setInt32,
);

const BigInt64DataViewBytes = createDataViewClass(
    BigInt64Array.BYTES_PER_ELEMENT,
    getBigInt64,
    setBigInt64,
);

const Float32DataViewBytes = createDataViewClass(
    Float32Array.BYTES_PER_ELEMENT,
    getFloat32,
    setFloat32,
);

const Float64DataViewBytes = createDataViewClass(
    Float64Array.BYTES_PER_ELEMENT,
    getFloat64,
    setFloat64,
);
