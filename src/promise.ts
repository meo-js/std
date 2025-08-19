/**
 * @public
 * @module
 */
import type * as tf from 'type-fest';
import type { fn } from './function.js';
import { isPromise } from './predicate.js';

/**
 * 值或 {@link Promise} 值类型
 */
export type Promisable<T = unknown> = tf.Promisable<T>;

/**
 * 值或 {@link PromisableLike} 值类型
 */
export type PromisableLike<T = unknown> = T | PromiseLike<T>;

/**
 * 解析 `thenable` 类型
 *
 * 与 {@link Awaited} 不同的是不会递归地解析。
 */
export type Unwrap<T> = T extends null | undefined
  ? T
  : T extends object & {
        then(onfulfilled: infer F, ...args: infer _): unknown;
      }
    ? F extends (value: infer V, ...args: infer _) => unknown
      ? V
      : never
    : T;

/**
 * 创建函数类型的异步版本
 */
export type Asyncify<T extends fn> = tf.Asyncify<T>;

/**
 * 将 {@link PromisableLike} 值转换为 {@link Promise} 值
 *
 */
export async function promisify<T>(value?: PromisableLike<T>): Promise<T> {
  if (isPromise(value)) {
    return value;
  } else {
    return Promise.resolve(value!);
  }
}
