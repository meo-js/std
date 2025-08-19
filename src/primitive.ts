/**
 * @public
 * @module
 */

/**
 * 原始 JavaScript 值类型
 */
export type Primitive =
  | number
  | symbol
  | string
  | boolean
  | bigint
  | undefined
  | null;

/**
 * 获取值的类型标签
 *
 * 即调用 `Object.prototype.toString.call(value)` 的结果
 *
 * @example
 * ```ts
 * getStringTag("Hello");
 * // [object String]
 * ```
 */
export function getStringTag(value: unknown): string {
  return Object.prototype.toString.call(value);
}
