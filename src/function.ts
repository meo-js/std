/**
 * @public
 *
 * @module
 */
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
    TReturn = unknown,
    TNext = unknown,
> = fn<Arguments, Generator<T, TReturn, TNext>>;

/**
 * 异步生成器函数
 */
export type AsyncGenFn<
    Arguments extends readonly unknown[] = uncertain,
    T = unknown,
    TReturn = unknown,
    TNext = unknown,
> = fn<Arguments, AsyncGenerator<T, TReturn, TNext>>;

/**
 * 异步函数
 */
export type AsyncFn<
    Arguments extends readonly unknown[] = uncertain,
    T = unknown,
> = fn<Arguments, Promise<T>>;
