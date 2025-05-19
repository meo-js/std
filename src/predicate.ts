/**
 * @public
 *
 * @module
 */
import { Temporal } from "temporal-polyfill";
import type * as tf from "type-fest";
import type { AbstractClass, Class } from "./class.js";
import type {
    AnyCollection,
    AnyMap,
    AnySet,
    Collection,
    WeakCollection,
} from "./collection.js";
import type { AsyncGenFn, GenFn } from "./function.js";
import type { Jsonifiable } from "./json.js";
import type { Numeric } from "./math.js";
import type { PlainObject, RecordObject } from "./object.js";
import type { Primitive } from "./primitive.js";
import type { TemporalObject } from "./temporal/shared.js";
import type { none } from "./ts.js";
import type { TypedArray } from "./typed-array.js";

const GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    function* () {},
) as object;

const ASYNC_GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    async function* () {},
) as object;

/**
 * 是否为 `unknown` 类型
 */
export type IsUnknown<T> = tf.IsUnknown<T>;

/**
 * 是否为 `any` 类型
 */
export type IsAny<T> = tf.IsAny<T>;

/**
 * 是否为 `never` 类型
 */
export type IsNever<T> = tf.IsNever<T>;

/**
 * 是否为 `null` 类型
 */
export type IsNull<T> = T extends null ? true : false;

/**
 * 是否为 `undefined` 类型
 */
export type IsUndefined<T> = T extends undefined ? true : false;

/**
 * 是否为 {@link none} 类型
 */
export type IsNone<T> = T extends null | undefined ? true : false;

/**
 * 检测值是否为 `null`
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isNull(value: unknown): value is null {
    return value === null;
}

/**
 * 检测值是否为 `undefined`
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isUndefined(value: unknown): value is undefined {
    return value === undefined;
}

/**
 * 检测值是否为 {@link none}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isNone(value: unknown): value is none {
    return value == null;
}

/**
 * 检测值是否为有效值（即非 `null`、`undefined`、`NaN`）
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isValidValue(value: unknown): boolean {
    return value != null && !Number.isNaN(value);
}

/**
 * 检测值是否为 {@link Primitive} 原始值类型之一
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPrimitive(value: unknown): value is Primitive {
    return (
        value == null
        || (typeof value !== "object" && typeof value !== "function")
    );
}

/**
 * 检测值是否为 {@link String} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * 检测值是否为 {@link Number} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

/**
 * 检测值是否为 {@link BigInt} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isBigInt(value: unknown): value is bigint {
    return typeof value === "bigint";
}

/**
 * 检测值是否为 {@link Number} 或 {@link BigInt} 类型，无限值被视为有效值，但 `NaN` 不被视为有效值。
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isNumeric(value: unknown): value is Numeric {
    const type = typeof value;
    return !Number.isNaN(value) && (type === "number" || type === "bigint");
}

/**
 * 检测值是否为 {@link NaN}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isNaN(value: unknown): boolean {
    return Number.isNaN(value);
}

/**
 * 检测值是否为 {@link Boolean} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * 检测值是否为 {@link Symbol} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === "symbol";
}

/**
 * 检测值是否为 {@link Object} 类型，不包括 {@link Function}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isObject<T extends object = object>(
    value: unknown,
): value is T {
    return value != null && typeof value === "object";
}

/**
 * 检测值是否为 {@link Object} 或 {@link Function} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isObjectLike<T extends object = object>(
    value: unknown,
): value is T {
    return (
        value != null
        && (typeof value === "object" || typeof value === "function")
    );
}

/**
 * 检测值是否为普通对象
 *
 * @param value 任意值
 * @returns `boolean`
 *
 * @example
 * ```ts
 * // true:
 * isRecordObject({});
 * isRecordObject({ key: 'value' });
 * isRecordObject({ key: new Date() });
 * isRecordObject(new Object());
 * isRecordObject(Object.create(null));
 * isRecordObject(new Proxy({}, {}));
 * isRecordObject({ [Symbol('tag')]: 'A' });
 *
 * // false:
 * isRecordObject(new Test());
 * isRecordObject(10);
 * isRecordObject(null);
 * isRecordObject('hello');
 * isRecordObject([]);
 * isRecordObject(new Date());
 * isRecordObject(new Uint8Array([1]));
 * isRecordObject(Buffer.from('ABC'));
 * isRecordObject(Promise.resolve({}));
 * isRecordObject(Object.create({}));
 * isRecordObject(globalThis);
 * ```
 */
export function isRecordObject<T extends object = RecordObject>(
    value: unknown,
): value is T {
    if (!value || typeof value !== "object") {
        return false;
    }

    const proto = Object.getPrototypeOf(value) as
        | typeof Object.prototype
        | null;

    const hasObjectPrototype =
        proto === null
        || proto === Object.prototype
        // Required to support node:vm.runInNewContext({})
        || Object.getPrototypeOf(proto) === null;

    if (!hasObjectPrototype) {
        return false;
    }

    return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * 检测值是否为只有字符串键的普通对象
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainObject<T extends object = PlainObject>(
    value: unknown,
): value is T {
    if (!isRecordObject(value)) {
        return false;
    }

    const keys = Reflect.ownKeys(value);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (typeof key !== "string") {
            return false;
        }
    }

    return true;
}

/**
 * 检查值是否为有效的 Json 字符串
 *
 * 注意：该函数执行 {@link JSON.parse} 来验证字符串是否有效的 Json 格式，性能消耗可能很高。
 *
 * @param value 任意值
 * @returns `boolean`
 *
 * @example
 * isJson('{"name":"John","age":30}'); // true
 * isJson('[1,2,3]'); // true
 * isJson('true'); // true
 * isJson('invalid json'); // false
 * isJson(null); // false (not a string)
 */
export function isJson(value: unknown): value is string {
    if (typeof value !== "string") {
        return false;
    }

    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * 检查值是否能序列化为 Json 字符串
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isJsonifiable(value: unknown): value is Jsonifiable {
    switch (typeof value) {
        case "object": {
            return value === null || isJsonArray(value) || isJsonObject(value);
        }
        case "string":
        case "number":
        case "boolean": {
            return true;
        }
        default: {
            return false;
        }
    }
}

function isJsonArray(value: unknown): value is unknown[] {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.every(item => isJsonifiable(item));
}

function isJsonObject(obj: unknown): obj is RecordObject {
    if (!isRecordObject(obj)) {
        return false;
    }

    const keys = Reflect.ownKeys(obj);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = obj[key];

        if (typeof key !== "string") {
            return false;
        }

        if (!isJsonifiable(value)) {
            return false;
        }
    }

    return true;
}

/**
 * 检测值是否为 {@link Array} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
    return Array.isArray(value);
}

/**
 * 检测值是否为 {@link Map}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isMap<K = unknown, V = unknown>(
    value: unknown,
): value is Map<K, V> {
    return value instanceof Map;
}

/**
 * 检测值是否为 {@link WeakMap}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isWeakMap<K extends WeakKey = WeakKey, V = unknown>(
    value: unknown,
): value is WeakMap<K, V> {
    return value instanceof WeakMap;
}

/**
 * 检测值是否为 {@link AnyMap}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAnyMap<K = unknown, V = unknown>(
    value: unknown,
): value is AnyMap<K, V> {
    return isMap<K, V>(value) || isWeakMap<K & WeakKey, V>(value);
}

/**
 * 检测值是否为 {@link Set}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isSet<T = unknown>(value: unknown): value is Set<T> {
    return value instanceof Set;
}

/**
 * 检测值是否为 {@link WeakSet}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isWeakSet<T extends WeakKey = WeakKey>(
    value: unknown,
): value is WeakSet<T> {
    return value instanceof WeakSet;
}

/**
 * 检测值是否为 {@link AnySet} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAnySet<T = unknown>(value: unknown): value is AnySet<T> {
    return isSet<T>(value) || isWeakSet<T & WeakKey>(value);
}

/**
 * 检测值是否为 {@link Collection} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isCollection<K = unknown, V = unknown>(
    value: unknown,
): value is Collection<K, V> {
    return isMap<K, V>(value) || isSet<V>(value);
}

/**
 * 检测值是否为 {@link WeakCollection} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isWeakCollection<T extends WeakKey = WeakKey, V = unknown>(
    value: unknown,
): value is WeakCollection<T, V> {
    return isWeakMap<T, V>(value) || isWeakSet<T>(value);
}

/**
 * 检测值是否为 {@link AnyCollection} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAnyCollection(value: unknown): value is AnyCollection {
    return isCollection(value) || isWeakCollection(value);
}

/**
 * 检测值是否为 {@link Date}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

/**
 * 检测值是否为 {@link RegExp}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

/**
 * 检测值是否为 {@link WeakRef}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isWeakRef<T extends object = object>(
    value: unknown,
): value is WeakRef<T> {
    return value instanceof WeakRef;
}

/**
 * 检测值是否为 {@link Temporal.Instant}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isInstant(value: unknown): value is Temporal.Instant {
    return value instanceof Temporal.Instant;
}

/**
 * 检测值是否为 {@link Temporal.Duration}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isDuration(value: unknown): value is Temporal.Duration {
    return value instanceof Temporal.Duration;
}

/**
 * 检测值是否为 {@link Temporal.PlainDate}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainDate(value: unknown): value is Temporal.PlainDate {
    return value instanceof Temporal.PlainDate;
}

/**
 * 检测值是否为 {@link Temporal.PlainTime}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainTime(value: unknown): value is Temporal.PlainTime {
    return value instanceof Temporal.PlainTime;
}

/**
 * 检测值是否为 {@link Temporal.PlainDateTime}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainDateTime(
    value: unknown,
): value is Temporal.PlainDateTime {
    return value instanceof Temporal.PlainDateTime;
}

/**
 * 检测值是否为 {@link Temporal.ZonedDateTime}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isZonedDateTime(
    value: unknown,
): value is Temporal.ZonedDateTime {
    return value instanceof Temporal.ZonedDateTime;
}

/**
 * 检测值是否为 {@link Temporal.PlainMonthDay}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainMonthDay(
    value: unknown,
): value is Temporal.PlainMonthDay {
    return value instanceof Temporal.PlainMonthDay;
}

/**
 * 检测值是否为 {@link Temporal.PlainYearMonth}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPlainYearMonth(
    value: unknown,
): value is Temporal.PlainYearMonth {
    return value instanceof Temporal.PlainYearMonth;
}

/**
 * 检测值是否为 {@link TemporalObject}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isTemporalObject(value: unknown): value is TemporalObject {
    return Object.prototype.toString
        .call(value)
        .startsWith("[object Temporal.");
}

/**
 * 检测值是否为 [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects)
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isModule(value: unknown) {
    return Object.prototype.toString.call(value) === "[object Module]";
}

/**
 * 检测值是否为 {@link Class} 类型
 *
 * 注意：仅原生类才能保证检测完全正确，某些转译代码可能会导致检测不准确。
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isClass<T extends AbstractClass = Class>(
    value: unknown,
): value is T {
    return (
        typeof value === "function"
        && Object.getOwnPropertyDescriptor(value, "prototype")?.writable
            === false
    );
}

/**
 * 检测值是否为 {@link Function} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isFunction<T extends Function = Function>(
    value: unknown,
): value is T {
    return typeof value === "function";
}

/**
 * 检测值是否为 {@link GeneratorFunction} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isGeneratorFunction<T extends GenFn = GeneratorFunction>(
    value: unknown,
): value is T {
    if (isFunction(value)) {
        return Object.getPrototypeOf(value) === GENERATOR_FUNC_PROTOTYPE;
    } else {
        return false;
    }
}

/**
 * 检测值是否为 {@link AsyncGeneratorFunction} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAsyncGeneratorFunction<
    T extends AsyncGenFn = AsyncGeneratorFunction,
>(value: unknown): value is T {
    if (isFunction(value)) {
        return Object.getPrototypeOf(value) === ASYNC_GENERATOR_FUNC_PROTOTYPE;
    } else {
        return false;
    }
}

/**
 * 检测值是否为 {@link Generator} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isGenerator(value: unknown): value is Generator {
    if (isObjectLike(value)) {
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
 * 检测值是否为 {@link AsyncGenerator} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAsyncGenerator(value: unknown): value is AsyncGenerator {
    if (isObjectLike(value)) {
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
 * 检测值是否为 {@link Iterable} 可迭代对象类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
    return isObjectLike(value) && Symbol.iterator in value;
}

/**
 * 检测值是否为 {@link AsyncIterable} 异步可迭代对象类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isAsyncIterable(
    value: unknown,
): value is AsyncIterable<unknown> {
    return isObjectLike(value) && Symbol.asyncIterator in value;
}

/**
 * 检测值是否为 {@link PromiseLike} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    return (
        isObjectLike(value)
        && typeof (<Partial<PromiseLike<unknown>>>value).then === "function"
    );
}

/**
 * 检测值是否为 {@link Promise} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise;
}

/**
 * 检测值是否为 {@link Error} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isError(value: unknown): value is Error {
    return value instanceof Error;
}

/**
 * 检测值是否为原生实现函数
 *
 * 根据 {@link Function.prototype.toString} 的返回值是否包括 `"native code"` 来判断。
 *
 * @param target 函数/类
 * @returns `boolean`
 */
export function isNativeCode(target: Function): boolean {
    return Function.prototype.toString.call(target).includes("native code");
}

/**
 * 检测值是否为 {@link ArrayBuffer}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
    return value instanceof ArrayBuffer;
}

/**
 * 检测值是否为 {@link ArrayBufferView} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isArrayBufferView(value: unknown): value is ArrayBufferView {
    return ArrayBuffer.isView(value);
}

/**
 * 检测值是否为 {@link TypedArray} 类型之一
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isTypedArray(value: unknown): value is TypedArray {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * 检测值是否为 {@link BufferSource} 类型
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isBufferSource(value: unknown): value is BufferSource {
    return (
        isObjectLike(value)
        && (isArrayBuffer(value) || isArrayBufferView(value))
    );
}

/**
 * 检测值是否为 {@link DataView}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isDataView(value: unknown): value is DataView {
    return value instanceof DataView;
}

/**
 * 检测值是否为 {@link Int8Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isInt8Array(value: unknown): value is Int8Array {
    return value instanceof Int8Array;
}

/**
 * 检测值是否为 {@link Uint8Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isUint8Array(value: unknown): value is Uint8Array {
    return value instanceof Uint8Array;
}

/**
 * 检测值是否为 {@link Uint8ClampedArray}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isUint8ClampedArray(
    value: unknown,
): value is Uint8ClampedArray {
    return value instanceof Uint8ClampedArray;
}

/**
 * 检测值是否为 {@link Int16Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isInt16Array(value: unknown): value is Int16Array {
    return value instanceof Int16Array;
}

/**
 * 检测值是否为 {@link Uint16Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isUint16Array(value: unknown): value is Uint16Array {
    return value instanceof Uint16Array;
}

/**
 * 检测值是否为 {@link Int32Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isInt32Array(value: unknown): value is Int32Array {
    return value instanceof Int32Array;
}

/**
 * 检测值是否为 {@link Uint32Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isUint32Array(value: unknown): value is Uint32Array {
    return value instanceof Uint32Array;
}

/**
 * 检测值是否为 {@link Float32Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isFloat32Array(value: unknown): value is Float32Array {
    return value instanceof Float32Array;
}

/**
 * 检测值是否为 {@link Float64Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isFloat64Array(value: unknown): value is Float64Array {
    return value instanceof Float64Array;
}

/**
 * 检测值是否为 {@link BigInt64Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isBigInt64Array(value: unknown): value is BigInt64Array {
    return value instanceof BigInt64Array;
}

/**
 * 检测值是否为 {@link BigUint64Array}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isBigUint64Array(value: unknown): value is BigUint64Array {
    return value instanceof BigUint64Array;
}
