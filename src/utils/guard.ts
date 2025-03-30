import type { Any, Primitive, TypedArray } from "../types/fix.js";

const GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    function* () {},
) as object;

const ASYNC_GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    async function* () {},
) as object;

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Primitive} 原始值类型之一
 */
export function isPrimitive(value: unknown): value is Primitive {
    return (
        value == null
        || (typeof value !== "object" && typeof value !== "function")
    );
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link String}
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Number}
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link BigInt}
 */
export function isBigInt(value: unknown): value is bigint {
    return typeof value === "bigint";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Boolean}
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Symbol}
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === "symbol";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Object}，但不包括 {@link Function}
 */
export function isObject<T extends object = object>(
    value: unknown,
): value is T {
    return value != null && typeof value === "object";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Object}，包括 {@link Function}
 */
export function isAnyObject<T extends object = object>(
    value: unknown,
): value is T {
    return (
        value != null
        && (typeof value === "object" || typeof value === "function")
    );
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Array}
 */
export function isArray<T = Any>(value: unknown): value is T[] {
    return Array.isArray(value);
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Map}
 */
export function isMap<K = Any, V = Any>(value: unknown): value is Map<K, V> {
    return value instanceof Map;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Set}
 */
export function isSet<T = Any>(value: unknown): value is Set<T> {
    return value instanceof Set;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Function}
 */
export function isFunction(value: unknown): value is Function {
    return typeof value === "function";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link GeneratorFunction}
 */
export function isGeneratorFunction(
    value: unknown,
): value is GeneratorFunction {
    if (isFunction(value)) {
        return Object.getPrototypeOf(value) === GENERATOR_FUNC_PROTOTYPE;
    } else {
        return false;
    }
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link AsyncGeneratorFunction}
 */
export function isAsyncGeneratorFunction(
    value: unknown,
): value is AsyncGeneratorFunction {
    if (isFunction(value)) {
        return Object.getPrototypeOf(value) === ASYNC_GENERATOR_FUNC_PROTOTYPE;
    } else {
        return false;
    }
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Generator}
 */
export function isGenerator(value: unknown): value is Generator {
    if (isAnyObject(value)) {
        return (
            <keyof Generator>"next" in value
            && <keyof Generator>"return" in value
            && <keyof Generator>"throw" in value
            && <keyof Generator>Symbol.iterator in value
        );
    } else {
        return false;
    }
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link AsyncGenerator}
 */
export function isAsyncGenerator(value: unknown): value is AsyncGenerator {
    if (isAnyObject(value)) {
        return (
            <keyof AsyncGenerator>"next" in value
            && <keyof AsyncGenerator>"return" in value
            && <keyof AsyncGenerator>"throw" in value
            && <keyof AsyncGenerator>Symbol.asyncIterator in value
        );
    } else {
        return false;
    }
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Iterable} 可迭代对象
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
    return isAnyObject(value) && Symbol.iterator in value;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link AsyncIterable} 异步可迭代对象
 */
export function isAsyncIterable(
    value: unknown,
): value is AsyncIterable<unknown> {
    return isAnyObject(value) && Symbol.asyncIterator in value;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link PromiseLike} 对象
 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- checked.
    return isAnyObject(value) && typeof (<Any>value).then === "function";
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Promise}
 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise;
}

/**
 * 根据 {@link Function.prototype.toString} 的返回值是否包括 `"native code"` 来判断。
 *
 * @param target 函数/类
 * @returns 返回目标是否为原生实现函数
 */
export function isNativeCode(target: Function): boolean {
    return Function.prototype.toString.call(target).includes("native code");
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link ArrayBuffer}
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
    return value instanceof ArrayBuffer;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link ArrayBufferView}
 */
export function isArrayBufferView(value: unknown): value is ArrayBufferView {
    return ArrayBuffer.isView(value);
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link TypedArray} 类型之一
 */
export function isTypedArray(value: unknown): value is TypedArray {
    return (
        isAnyObject(value)
        && ArrayBuffer.isView(value)
        && !(value instanceof DataView)
    );
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link DataView}
 */
export function isDataView(value: unknown): value is DataView {
    return value instanceof DataView;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Int8Array}
 */
export function isInt8Array(value: unknown): value is Int8Array {
    return value instanceof Int8Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Uint8Array}
 */
export function isUint8Array(value: unknown): value is Uint8Array {
    return value instanceof Uint8Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Uint8ClampedArray}
 */
export function isUint8ClampedArray(
    value: unknown,
): value is Uint8ClampedArray {
    return value instanceof Uint8ClampedArray;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Int16Array}
 */
export function isInt16Array(value: unknown): value is Int16Array {
    return value instanceof Int16Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Uint16Array}
 */
export function isUint16Array(value: unknown): value is Uint16Array {
    return value instanceof Uint16Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Int32Array}
 */
export function isInt32Array(value: unknown): value is Int32Array {
    return value instanceof Int32Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Uint32Array}
 */
export function isUint32Array(value: unknown): value is Uint32Array {
    return value instanceof Uint32Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Float32Array}
 */
export function isFloat32Array(value: unknown): value is Float32Array {
    return value instanceof Float32Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link Float64Array}
 */
export function isFloat64Array(value: unknown): value is Float64Array {
    return value instanceof Float64Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link BigInt64Array}
 */
export function isBigInt64Array(value: unknown): value is BigInt64Array {
    return value instanceof BigInt64Array;
}

/**
 * @param value 任意值
 * @returns 返回值是否为 {@link BigUint64Array}
 */
export function isBigUint64Array(value: unknown): value is BigUint64Array {
    return value instanceof BigUint64Array;
}
