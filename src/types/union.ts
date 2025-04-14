import type { Any } from "./any.js";

/**
 * 并集转为交集类型
 */
export type UnionToIntersection<TUnion> = (
    TUnion extends Any ? (arg: TUnion) => void : never
) extends (arg: infer TArg) => void
    ? TArg
    : never;
