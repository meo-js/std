/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";
import type { ApplyDefaultOptions as _ApplyDefaultOptions } from "type-fest/source/internal/object.js";
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
 * 创建一个不变类型，不允许接受该类型的任何父子类型
 */
export type Invariant<T> = tf.InvariantOf<T>;

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
 * 将字面量转换为原始类型
 */
export type ToPrimitive<T> = tf.LiteralToPrimitive<T>;

/**
 * 将字面量转换为原始类型
 */
export type ToPrimitiveDeep<T> = tf.LiteralToPrimitiveDeep<T>;

/**
 * 转换为可能为 {@link none} 的类型
 */
export type Nullable<T> = T | none;

/**
 * 转换为可变类型
 */
export type Mutable<T> = tf.Writable<T>;

/**
 * 深度转换为可变类型
 */
export type MutableDeep<T> = tf.WritableDeep<T>;

/**
 * 深度转换为只读类型
 */
export type ReadonlyDeep<T> = tf.ReadonlyDeep<T>;

/**
 * 深度转换为必须类型
 */
export type RequiredDeep<T> = tf.RequiredDeep<T>;

/**
 * 深度转换为可选类型
 */
export type PartialDeep<T> = tf.PartialDeep<T>;

/**
 * 用于处理带默认值选项对象的类型工具
 *
 * 此工具类型帮助你合并选项的默认值，类似于 `const { value = default, ... } = options ?? {}` 语句。
 *
 * @example
 * 可参考 {@link SetClass} 类型的实现来了解具体用法。
 */
export type ApplyDefaultOptions<
    Options extends object,
    Default extends Simplify<
        Omit<Required<Options>, tf.RequiredKeysOf<Options>>
            & Partial<Record<tf.RequiredKeysOf<Options>, never>>
    >,
    Input extends Options,
> = _ApplyDefaultOptions<Options, Default, Input>;

/**
 * 允许通过 {@link structuredClone} 的类型
 */
export type StructuredCloneable = tf.StructuredCloneable;

/**
 * 判断给定的类型是否为[字面量类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
 */
export type IsLiteral<T> = tf.IsLiteral<T>;

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
