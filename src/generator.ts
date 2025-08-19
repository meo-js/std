/**
 * @public
 * @module
 */

import type { GenFn } from './function.js';

/**
 * 生成器值类型
 */
export type ValueOf<T extends AsyncGenerator | Generator> =
  T extends AsyncGenerator<infer R>
    ? R
    : T extends Generator<infer R2>
      ? R2
      : never;

/**
 * 生成器返回值类型
 */
export type ReturnOf<T extends AsyncGenerator | Generator> =
  T extends AsyncGenerator<infer _, infer R>
    ? R
    : T extends Generator<infer _, infer R2>
      ? R2
      : never;

/**
 * 生成器 {@link Generator.next} 参数类型
 */
export type SendOf<T extends AsyncGenerator | Generator> =
  T extends AsyncGenerator<infer _, infer R, infer N>
    ? R
    : T extends Generator<infer _, infer R2, infer N2>
      ? R2
      : never;

/**
 * 包装生成器函数使得首次传入 {@link Generator.next} 的参数能被获取
 *
 * @example 将数值转换为字符串的生成器
 * ```ts
 * const stream = sent(function* () {
 *     let input = yield;
 *     while (true) {
 *         const output = input.toString();
 *         input = yield output;
 *     }
 * })();
 * console.log(stream.next(1).value); // "1"
 * console.log(stream.next(2).value); // "2"
 * ```
 *
 * @see [tc39/proposal-function.sent](https://github.com/tc39/proposal-function.sent)
 */
// FIXME: Function.sent 提案普及后移除
// TODO: 可以同时做成一个装饰器
export function sent<T extends GenFn>(generatorFunction: T): T {
  return ((...params: Parameters<T>) => {
    const iterator = generatorFunction(...params);
    iterator.next();
    return iterator;
  }) as T;
}
