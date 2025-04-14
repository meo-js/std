import type { LiteralUnion } from "type-fest";
import type { Primitive } from "./primitive.js";

/**
 * 允许组合原始类型和字面量类型，同时不会失去 IDE 的自动完成功能
 *
 * 这是解决 [TypeScript#29729](https://github.com/Microsoft/TypeScript/issues/29729) 问题的一种方法，一旦不再需要，它将被移除。
 */
export type Literal<T, BaseType extends Primitive> = LiteralUnion<T, BaseType>;
