import type { LiteralUnion } from "type-fest";

/**
 * 作为对某些 Linter 规则的逃生窗口，例如 ESLint 的 `no-explicit-any` 规则，原则上尽量避免使用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type Any = any;

/**
 * 作为对某些 Linter 规则的逃生窗口，例如 ESLint 的 `no-explicit-any` 规则，原则上尽量避免使用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type Anys = any[];

/**
 * 所有原始的 JavaScript 值类型
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
 * 允许组合原始类型和字面量类型，同时不会失去 IDE 的自动完成功能
 *
 * 这是解决 [TypeScript#29729](https://github.com/Microsoft/TypeScript/issues/29729) 问题的一种方法，一旦不再需要，它将被移除。
 */
export type Literal<T, BaseType extends Primitive> = LiteralUnion<T, BaseType>;
