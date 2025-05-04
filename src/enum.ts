/**
 * @public
 *
 * @module
 */
import type { PlainObject } from "./object.js";

/**
 * 枚举键的联合类型
 *
 * @example
 * Keys<typeof Enum>;
 */
export type KeyOf<T extends object> = keyof T;

/**
 * 枚举值类型
 *
 * @example
 * Values<typeof Enum>;
 */
export type ValueOf<T extends object> = T[keyof T];

/**
 * 枚举成员类型
 *
 * @example
 * Members<typeof Enum>;
 */
export type MemberOf<T extends object> = [KeyOf<T>, ValueOf<T>][];

/**
 * 获取数值枚举所有成员
 *
 * @param tsEnum 枚举对象
 *
 * @example
 * const result = [['A', 1], ['B', 2]];
 */
export function getMembers<T extends object>(tsEnum: T): [keyof T, number][] {
    const result: [keyof T, number][] = [];
    for (const key in tsEnum) {
        if (!Number.isNaN(Number(key))) continue;
        if (Object.hasOwn(tsEnum, key)) {
            const value = tsEnum[key];
            result.push([key, value as number]);
        }
    }
    return result;
}

// TODO 改进这些函数类型的实验：
// enum A {
//     a = 1,
//     b = 2,
// }
// const aa = Object.fromEntries([1, "2"].map((v, i) => [i, v]));
// let a: ArrayToObject<UnionToTuple<keyof typeof A>>;
// let b: UnionToTuple<(typeof A)[keyof typeof A]>;
// let c: Entries<typeof A> = null!;
// const d = c[0][0]

/**
 * 获取数值枚举所有成员键
 *
 * @param tsEnum 枚举对象
 *
 * @example
 * const result = ['A', 'B'];
 */
export function getKeys<T extends object>(tsEnum: T): (keyof T)[] {
    const result: (keyof T)[] = [];
    for (const key in tsEnum) {
        if (!Number.isNaN(Number(key))) continue;
        if (Object.hasOwn(tsEnum, key)) {
            result.push(key);
        }
    }
    return result;
}

/**
 * 获取数值枚举所有成员值
 *
 * @param tsEnum 枚举对象
 *
 * @example
 * const result = [1, 2];
 */
export function getValues<T extends object>(tsEnum: T): number[] {
    const result: number[] = [];
    for (const key in tsEnum) {
        if (Object.hasOwn(tsEnum, key)) {
            const value = Number(tsEnum[key]);
            if (!Number.isNaN(value)) {
                result.push(value);
            }
        }
    }
    return result;
}

/**
 * 返回是否是指定数值枚举的成员
 *
 * @param tsEnum 枚举对象
 * @param key 成员键
 * @param value 成员值
 */
export function isMember<T extends object>(
    tsEnum: T,
    key: string,
    value: number,
) {
    for (const k in tsEnum) {
        if (!Number.isNaN(Number(k))) continue;
        if (Object.hasOwn(tsEnum, k)) {
            if (k === key) {
                return (<PlainObject<number>>tsEnum)[k] === value;
            }
        }
    }
    return false;
}

/**
 * 返回是否是指定数值枚举的成员键
 *
 * @param tsEnum 枚举对象
 * @param key 成员键
 */
export function isKey<T extends object>(tsEnum: T, key: string) {
    for (const k in tsEnum) {
        if (!Number.isNaN(Number(k))) continue;
        if (Object.hasOwn(tsEnum, k)) {
            if (k === key) return true;
        }
    }
    return false;
}

/**
 * 返回是否是指定数值枚举的成员值
 *
 * @param tsEnum 枚举对象
 * @param value 成员值
 */
export function isValue<T extends object>(tsEnum: T, value: number) {
    for (const key in tsEnum) {
        if (Object.hasOwn(tsEnum, key)) {
            const v = Number(tsEnum[key]);
            if (!Number.isNaN(v)) {
                if (v === value) return true;
            }
        }
    }
    return false;
}
