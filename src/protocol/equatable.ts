import { USE_CUSTOM_EQUAL } from "compile-constants/flags";
import { isAnyObject } from "../guard.js";
import { equal as _equal } from "./symbols.js";

/**
 * 具有自定义相等判定函数的接口
 */
export interface Equatable {
    /**
     * 返回该对象是否与传入值相等
     */
    [_equal](value: unknown): boolean;
}

/**
 * 返回两个值是否相等
 *
 * 若其中一个值是实现了 {@link Equatable} 接口的对象则使用自定义比较函数，否则使用 {@link Object.is} 进行判定
 */
export function equal(a: unknown, b: unknown): boolean {
    if (isAnyObject(a)) {
        const equal = (<Partial<Equatable>>a)[_equal];
        if (equal) {
            return equal.call(a, b);
        }
    }
    if (isAnyObject(b)) {
        const equal = (<Partial<Equatable>>b)[_equal];
        if (equal) {
            return equal.call(b, a);
        }
    }
    return Object.is(a, b);
}

/**
 * 返回两个值是否相等
 *
 * 该函数根据 {@link USE_CUSTOM_EQUAL} 来决定使用 {@link equal} 还是 {@link Object.is} 进行判定
 */
export function is(a: unknown, b: unknown): boolean {
    return USE_CUSTOM_EQUAL ? equal(a, b) : Object.is(a, b);
}
