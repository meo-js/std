/**
 * @public
 * @module
 */

/**
 * 名义类型
 */
export type Tagged<Type, Token extends PropertyKey, Metadata = never> = Type
  & Tag<Token, Metadata>;

/**
 * 允许隐式转换的名义类型
 */
export type WeakTagged<Type, Token extends PropertyKey, Metadata = never> = Type
  & OptionalTag<Token, Metadata>;

/**
 * 获取名义类型的元数据
 */
export type MetadataOf<
  T extends Tag,
  Name extends PropertyKey,
> = T[typeof tag][Name];

/**
 * 转换为允许隐式转换的名义类型
 */
export type Weaken<T> =
  T extends Tagged<unknown, infer Token, infer Metadata>
    ? WeakTagged<Unwrap<T>, Token, Metadata>
    : T;

/**
 * 解开名义类型，转换为原始类型
 */
export type Unwrap<T> = RemoveAllTags<T>;

declare const tag: unique symbol;

interface TagContainer<Token> {
  readonly [tag]: Token;
}

interface OptionalTagContainer<Token> {
  readonly [tag]?: Token;
}

interface Tag<Token extends PropertyKey = PropertyKey, Metadata = never>
  extends TagContainer<Record<Token, Metadata>> {}

interface OptionalTag<Token extends PropertyKey = PropertyKey, Metadata = never>
  extends OptionalTagContainer<Record<Token, Metadata>> {}

type RemoveAllTags<T> = T extends Tag
  ? {
      [ThisTag in keyof T[typeof tag]]: T extends Tagged<
        infer Type,
        ThisTag,
        T[typeof tag][ThisTag]
      >
        ? RemoveAllTags<Type>
        : never;
    }[keyof T[typeof tag]]
  : T;
