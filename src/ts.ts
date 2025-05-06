/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";
import type { fn } from "./function.js";
import type { Primitive } from "./primitive.js";

// #export * from "!sub-modules"
// #region Generated exports
export * from "./ts/modifier.js";
export * from "./ts/nominal.js";
export * from "./ts/union.js";
// #endregion

/**
 * 将类型输出展平
 *
 * 用例：
 * - 将类型输出展平以改进 IDE 中的类型提示
 * - 将接口转换为类型以帮助进行赋值
 */
export type Simplify<T> = tf.Simplify<T>;

/**
 * 转换函数类型，用于解决不支持显式协逆变的问题
 *
 * @param T 函数类型
 */
// FIXME: 当前的 TypeScript 不支持显式协逆变，后续跟进 issues #41770 #10717
export type Covariant<T extends fn> = T extends (...args: infer A) => infer R
    ? (...args: { [P in keyof A]: uncertain }) => R
    : never;

/**
 * 允许组合原始类型和字面量类型，同时不会失去 IDE 的自动完成功能
 *
 * 这是解决 [TypeScript#29729](https://github.com/Microsoft/TypeScript/issues/29729) 问题的一种方法，一旦不再需要，它将被移除。
 */
export type Literal<T, BaseType extends Primitive> = tf.LiteralUnion<
    T,
    BaseType
>;

/**
 * 转换为可能为 {@link none} 的类型
 */
export type Nullable<T> = T | none;

/**
 * 类型 `null | undefined` 的简写形式
 */
export type none = null | undefined;

/**
 * 类型 `never` 的别名
 *
 * 由于该 [issue#55667](https://github.com/microsoft/TypeScript/issues/55667)，一些内置的类型在参数声明为 `never` 时无法正常工作，所以暂时指向 `any`，之后进行统一替换。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type uncertain = any;

/**
 * 类型 `never` 的别名
 *
 * 请勿滥用，一般用于类型的边缘情况。
 */
export type checked = never;
