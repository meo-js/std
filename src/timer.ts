/**
 * @public
 * @module
 */
import type { WeakTagged } from './ts/nominal.js';

/**
 * {@link setTimeout} 与 {@link setInterval} 的句柄
 *
 * 在浏览器或 Node.js 等任何环境下都可以正常使用。
 */
export type TimerHandle = WeakTagged<object | number, typeof timerHandleTag>;

declare const timerHandleTag: unique symbol;

/**
 * 返回使用 {@link setTimeout} 等待的 {@link Promise}
 *
 * @param ms 等待解决的时间，单位：毫秒
 */
export async function sleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}
