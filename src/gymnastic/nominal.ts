import type { Tagged } from "type-fest";
import type { TagContainer } from "type-fest/source/tagged.js";

type OptionalTag<Token extends PropertyKey, TagMetadata> = Partial<
    TagContainer<Record<Token, TagMetadata>>
>;

/**
 * 允许隐式转换的名义类型
 */
export type MaybeTagged<
    Type,
    TagName extends PropertyKey,
    TagMetadata = never,
> = Type & OptionalTag<TagName, TagMetadata>;

/**
 * 转换为允许隐式转换的名义类型
 */
export type Maybe<T> =
    T extends Tagged<infer Type, infer TagName, infer TagMetadata>
        ? MaybeTagged<Type, TagName, TagMetadata>
        : T;

export type {
    Tagged,
    GetTagMetadata as TagMeta,
    UnwrapTagged,
} from "type-fest";
