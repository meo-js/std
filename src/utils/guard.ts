import type { Any, Primitive } from "../types/fix.js";

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
