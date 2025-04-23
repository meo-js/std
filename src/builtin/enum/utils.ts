import type { StringObject } from "../../types/object.js";

/**
 * 获取数值枚举所有成员
 *
 * @param enumObject 枚举对象
 *
 * @example
 * const result = [['A', 1], ['B', 2]];
 */
export function getEnumMembers<T extends object>(
    enumObject: T,
): [keyof T, number][] {
    const result: [keyof T, number][] = [];
    for (const key in enumObject) {
        if (!Number.isNaN(Number(key))) continue;
        if (Object.hasOwn(enumObject, key)) {
            const value = enumObject[key];
            result.push([key, value as number]);
        }
    }
    return result;
}

/**
 * 获取数值枚举所有成员键
 *
 * @param enumObject 枚举对象
 *
 * @example
 * const result = ['A', 'B'];
 */
export function getEnumKeys<T extends object>(enumObject: T): (keyof T)[] {
    const result: (keyof T)[] = [];
    for (const key in enumObject) {
        if (!Number.isNaN(Number(key))) continue;
        if (Object.hasOwn(enumObject, key)) {
            result.push(key);
        }
    }
    return result;
}

/**
 * 获取数值枚举所有成员值
 *
 * @param enumObject 枚举对象
 *
 * @example
 * const result = [1, 2];
 */
export function getEnumValues<T extends object>(enumObject: T): number[] {
    const result: number[] = [];
    for (const key in enumObject) {
        if (Object.hasOwn(enumObject, key)) {
            const value = Number(enumObject[key]);
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
 * @param enumObject 枚举对象
 * @param key 成员键
 * @param value 成员值
 */
export function isEnumMember(enumObject: object, key: string, value: number) {
    for (const k in enumObject) {
        if (!Number.isNaN(Number(k))) continue;
        if (Object.hasOwn(enumObject, k)) {
            if (k === key) {
                return (<StringObject<number>>enumObject)[k] === value;
            }
        }
    }
    return false;
}

/**
 * 返回是否是指定数值枚举的成员键
 *
 * @param enumObject 枚举对象
 * @param key 成员键
 */
export function isEnumKey(enumObject: object, key: string) {
    for (const k in enumObject) {
        if (!Number.isNaN(Number(k))) continue;
        if (Object.hasOwn(enumObject, k)) {
            if (k === key) return true;
        }
    }
    return false;
}

/**
 * 返回是否是指定数值枚举的成员值
 *
 * @param enumObject 枚举对象
 * @param value 成员值
 */
export function isEnumValue<T extends object>(enumObject: T, value: number) {
    for (const key in enumObject) {
        if (Object.hasOwn(enumObject, key)) {
            const v = Number(enumObject[key]);
            if (!Number.isNaN(v)) {
                if (v === value) return true;
            }
        }
    }
    return false;
}
