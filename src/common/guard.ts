import type { Any, Primitive } from "./types.js";

const GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    function* () {},
) as object;

const ASYNC_GENERATOR_FUNC_PROTOTYPE = Object.getPrototypeOf(
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
    async function* () {},
) as object;

/**
 * 返回是否为原始值
 *
 * @param value 任意值
 */
export function isPrimitive(value: unknown): value is Primitive {
    return (
        value == null
        || (typeof value !== "object" && typeof value !== "function")
    );
}

/**
 * 返回是否为字符串
 *
 * @param value 任意值
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * 返回是否为数值
 *
 * @param value 任意值
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

/**
 * 返回是否为大整数
 *
 * @param value 任意值
 */
export function isBigInt(value: unknown): value is bigint {
    return typeof value === "bigint";
}

/**
 * 返回是否为布尔值
 *
 * @param value 任意值
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * 返回是否为符号
 *
 * @param value 任意值
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === "symbol";
}

/**
 * 返回是否为对象
 *
 * 与 {@link isAnyObject} 不同的是不包括函数
 *
 * @param value 任意值
 */
export function isObject<T extends object = object>(
    value: unknown,
): value is T {
    return value != null && typeof value === "object";
}

/**
 * 返回是否为对象或函数
 *
 * @param value 任意值
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
 * 返回是否为数组
 *
 * @param value 任意值
 */
export function isArray<T = Any>(value: unknown): value is T[] {
    return Array.isArray(value);
}

/**
 * 返回是否为 {@link Map}
 *
 * @param value 任意值
 */
export function isMap<K = Any, V = Any>(value: unknown): value is Map<K, V> {
    return value instanceof Map;
}

/**
 * 返回是否为 {@link Set}
 *
 * @param value 任意值
 */
export function isSet<T = Any>(value: unknown): value is Set<T> {
    return value instanceof Set;
}

/**
 * 返回是否为函数类型
 *
 * @param value 任意值
 */
export function isFunction(value: unknown): value is Function {
    return typeof value === "function";
}

/**
 * 返回是否为生成器函数类型
 *
 * @param value 任意值
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
 * 返回是否为异步生成器函数类型
 *
 * @param value 任意值
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
 * 返回是否为生成器对象类型
 *
 * @param value 任意值
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
 * 返回是否为异步生成器对象类型
 *
 * @param value 任意值
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
 * 返回是否为可迭代对象类型
 *
 * @param value 任意值
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
    return isAnyObject(value) && Symbol.iterator in value;
}

/**
 * 返回是否为异步可迭代对象类型
 *
 * @param value 任意值
 */
export function isAsyncIterable(
    value: unknown,
): value is AsyncIterable<unknown> {
    return isAnyObject(value) && Symbol.asyncIterator in value;
}

/**
 * 返回是否为 {@link PromiseLike} 类型对象
 *
 * @param value 任意值
 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- checked.
    return isAnyObject(value) && typeof (<Any>value).then === "function";
}

/**
 * 返回是否为 {@link Promise} 类型对象
 *
 * @param value 任意值
 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise;
}

/**
 * 返回是否为原生实现函数
 *
 * 根据 {@link Function.prototype.toString} 的返回值是否包括 `"native code"` 来判断。
 *
 * @param target 函数/类
 */
export function isNativeCode(target: Function): boolean {
    return Function.prototype.toString.call(target).includes("native code");
}
