import type { fn } from "../function.js";
import type { uncertain } from "./semantic.js";

/**
 * 转换函数类型，用于解决不支持显式协逆变的问题
 *
 * @param T 函数类型
 */
// FIXME: 当前的 TypeScript 不支持显式协逆变，后续跟进 issues #41770 #10717
export type Covariant<T extends fn> =
    // prettier-keep
    T extends (...args: infer A) => infer R
        ? // prettier-keep
          (...args: { [P in keyof A]: uncertain }) => R
        : never;
