import type { fn } from "../function.js";

/**
 * 绑定函数的 `this` 到指定类型
 */
export type SetThis<T extends fn, This> = T extends (
    ...args: infer A
) => infer R
    ? (this: This, ...args: A) => R
    : T;
