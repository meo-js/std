/**
 * 描述普通对象类型
 *
 * 等同于 `Record<PropertyKey, T>`
 */
export type KeyObject<T = unknown> = Record<PropertyKey, T>;

/**
 * 描述只有字符串键的普通对象类型
 *
 * 等同于 `Record<string, T>`
 */
export type StringObject<T = unknown> = Record<string, T>;

/**
 * 获取对象中是指定类型的键集合
 *
 * // REVIEW
 */
export type ObjectKeysExtract<TO extends object, TIncludeType> = {
    [K in keyof TO]: TO[K] extends TIncludeType ? K : never;
}[keyof TO];

/**
 * 获取对象中不是指定类型的键集合
 *
 * // REVIEW
 */
export type ObjectKeysExclude<TO extends object, TExcludeType> = {
    [K in keyof TO]: TO[K] extends TExcludeType ? never : K;
}[keyof TO];
