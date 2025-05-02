/**
 * @public
 *
 * @module
 */
import type { WeakTagged } from "./ts/nominal.js";

declare const timerHandleTag: unique symbol;

/**
 * {@link setTimeout} 与 {@link setInterval} 的句柄
 *
 * 在浏览器或 Node.js 等任何环境下都可以正常使用。
 */
export type TimerHandle = WeakTagged<object | number, typeof timerHandleTag>;
