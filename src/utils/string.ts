import type { TypedArray } from "../builtin/typed-array/type.js";
import { MAX_CALLSTACK_SIZE } from "./callstack.js";
import { isArray } from "./guard.js";

/**
 * 与 {@link String.fromCharCode} 作用完全一致，但采用性能最佳的实现方式
 */
export function fromCharCodes(arr: TypedArray | number[]) {
    if (isArray(arr)) {
        if (arr.length > MAX_CALLSTACK_SIZE) {
            // 只能单个进行转换，否则分块必须 slice 数组，这可能很昂贵
            const result = [];
            // eslint-disable-next-line @typescript-eslint/prefer-for-of -- checked.
            for (let i = 0; i < arr.length; i++) {
                result.push(String.fromCharCode(arr[i]));
            }
            return result.join("");
        } else {
            return String.fromCharCode.apply(undefined, arr);
        }
    } else {
        if (arr.length > MAX_CALLSTACK_SIZE) {
            // 分块进行转换
            const result = [];
            for (let i = 0; i < arr.length; i += MAX_CALLSTACK_SIZE) {
                const chunk = arr.subarray(i, i + MAX_CALLSTACK_SIZE);
                result.push(
                    String.fromCharCode.apply(undefined, chunk as never),
                );
            }
            return result.join("");
        } else {
            return String.fromCharCode.apply(undefined, arr as never);
        }
    }
}

/**
 * 与 {@link String.fromCodePoint} 作用完全一致，但采用性能最佳的实现方式
 */
export function fromCodePoints(arr: TypedArray | number[]) {
    if (isArray(arr)) {
        if (arr.length > MAX_CALLSTACK_SIZE) {
            // 只能单个进行转换，否则分块必须 slice 数组，这可能很昂贵
            const result = [];
            // eslint-disable-next-line @typescript-eslint/prefer-for-of -- checked.
            for (let i = 0; i < arr.length; i++) {
                result.push(String.fromCodePoint(arr[i]));
            }
            return result.join("");
        } else {
            return String.fromCodePoint.apply(undefined, arr);
        }
    } else {
        if (arr.length > MAX_CALLSTACK_SIZE) {
            // 分块进行转换
            const result = [];
            for (let i = 0; i < arr.length; i += MAX_CALLSTACK_SIZE) {
                const chunk = arr.subarray(i, i + MAX_CALLSTACK_SIZE);
                result.push(
                    String.fromCodePoint.apply(undefined, chunk as never),
                );
            }
            return result.join("");
        } else {
            return String.fromCodePoint.apply(undefined, arr as never);
        }
    }
}
