/**
 * @public
 *
 * @module
 */
import type { SetThis } from "./ts/modifier.js";
import type { uncertain } from "./ts/semantic.js";

/**
 * 函数
 *
 * @param Arguments 参数
 * @param Return 返回值
 */
export type fn<
    Arguments extends readonly unknown[] = uncertain,
    Return = unknown,
> = (...args: Arguments) => Return;

/**
 * 生成器函数
 */
export type GenFn<
    Arguments extends readonly unknown[] = uncertain,
    T = unknown,
    Return = unknown,
    Next = uncertain,
> = fn<Arguments, Generator<T, Return, Next>>;

/**
 * 异步生成器函数
 */
export type AsyncGenFn<
    Arguments extends readonly unknown[] = uncertain,
    T = unknown,
    Return = unknown,
    Next = uncertain,
> = fn<Arguments, AsyncGenerator<T, Return, Next>>;

/**
 * 异步函数
 */
export type AsyncFn<
    Arguments extends readonly unknown[] = uncertain,
    T = unknown,
> = fn<Arguments, Promise<T>>;

// 绑定缓存
const bindCaches = new WeakMap<object, WeakMap<Function, Function>>();

/**
 * 空函数
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function -- checked.
export const noop = () => {};

/**
 * 返回函数的已绑定 `this` 实例
 *
 * 内部维护着绑定缓存，同样的参数会返回同一个函数实例
 */
export function bind<T extends fn, This extends object>(
    fn: T,
    thisArg: This,
): SetThis<T, This> {
    let cache = bindCaches.get(thisArg);

    if (!cache) {
        bindCaches.set(thisArg, (cache = new WeakMap()));
    }

    let bound = cache.get(fn);

    if (!bound) {
        cache.set(fn, (bound = fn.bind(thisArg)));
    }

    return bound as SetThis<T, This>;
}
