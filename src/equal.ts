/**
 * @public
 *
 * @module
 */
import type { WeakCollection } from "./collection.js";
import { HAS_SHARED_ARRAYBUFFER } from "./env.js";
import { getOwnProperties, getPrototype, hasOwnProperty } from "./object.js";
import {
    isArray,
    isArrayBuffer,
    isDataView,
    isEquatable,
    isError,
    isMap,
    isObject,
    isSet,
    isSharedArrayBuffer,
    isTypedArray,
} from "./predicate.js";
import type { Primitive } from "./primitive.js";
import { Symbol } from "./protocol.js";
import type { checked } from "./ts.js";
import type { TypedArray } from "./typed-array.js";

/**
 * 自定义比较函数
 *
 * @param a 第一个值
 * @param b 第二个值
 * @param key 当前比较的键
 * @param parentA 第一个值的父对象
 * @param parentB 第二个值的父对象
 * @param isCompared 用于判断两个对象是否已经比较过且相等的函数，返回 `true` 则表示相等，可以直接返回，`false` 则表示需要继续比较
 * @returns 返回布尔值表示两个值是否相等，返回 `undefined` 则若回退到内置的值比较。
 */
export type Comparator = (
    a: unknown,
    b: unknown,
    key: unknown,
    parentA: unknown,
    parentB: unknown,
    isCompared: (a: object, b: object) => boolean,
) => boolean | undefined;

/**
 * 相等比较选项
 */
export interface EqualOptions {
    /**
     * 自定义比较函数
     *
     * @default undefined
     */
    comparator?: Comparator;

    /**
     * 是否忽略两者的原型（`prototype`）是否引用相等
     *
     * @default false
     */
    ignorePrototype?: boolean;
}

const stack = new Map<object, object>();
let root = true;

/**
 * 判断两个值是否相等
 *
 * 该函数与 {@link Object.is} 相似，但在处理 `0` 和 `-0` 时会将它们视为相等。
 *
 * @param a 第一个值
 * @param b 第二个值
 * @returns 如果两个值相等则返回 `true`，否则返回 `false`
 *
 * @example
 * ```ts
 * is(1, 1); // true
 * is(1, '1'); // false
 * is(NaN, NaN); // true
 * is(0, -0); // true
 * ```
 */
export function is(a: unknown, b: unknown): boolean {
    return Object.is(a === 0 ? 0 : a, b === 0 ? 0 : b);
}

// TODO: 测试用例必须包括以下两项，NodeJS deepStrictEqual 和 es-toolkit 都无法通过第一项
// 1.
// const a = [null, null];
// const b = [a, null];
// const c = [a, b];
// a[0] = c;
// a[1] = a;
// b[1] = b;

// 2.
// const a = [null, null];
// const b = [null, null];
// a[0] = b;
// a[1] = a;
// b[0] = a;
// b[1] = b;

/**
 * 返回两个参数是否相等
 *
 * 实现细节：
 * - {@link Primitive} 和 {@link Function} 使用 {@link is} 进行比较。
 * - 装盒的 {@link Primitive} 对象使用 {@link Object.prototype.valueOf valueOf} 方法进行比较。
 * - {@link Date} 使用 {@link Date.valueOf valueOf} 方法进行比较。
 * - {@link WeakCollection} 和 {@link WeakRef} 使用 `===` 进行比较。
 * - {@link RegExp} 会比较 {@link RegExp.source source}、{@link RegExp.flags flags} 和 {@link RegExp.lastIndex lastIndex} 属性。
 * - {@link ArrayBufferLike}、 {@link DataView} 会转换成 {@link TypedArray} 进行比较。
 * - {@link TypedArray} 会遍历所有元素并使用 {@link is} 进行比较，如果任意一方的 {@link TypedArray.buffer buffer} 已分离则不相等。
 * - {@link Array} 会比较所有元素。
 * - {@link Map} 会比较所有键值对，键使用 {@link Map.has has} 比较，值则进行值相等比较。
 * - {@link Set} 会比较所有元素。
 * - 其它对象将先用 `===` 比较原型（如果 {@link EqualOptions.ignorePrototype ignorePrototype} 为 `false`），然后再比较所有自身的属性及其值。
 */
export function equal(a: unknown, b: unknown, opts?: EqualOptions): boolean {
    const _root = root;
    root = false;

    const { ignorePrototype = false, comparator } = opts ?? {};

    const result = _equal(
        a,
        b,
        undefined,
        undefined,
        undefined,
        ignorePrototype,
        comparator,
    );

    if (_root) {
        root = true;
        stack.clear();
    }

    return result;
}

function _equal(
    a: unknown,
    b: unknown,
    key: unknown,
    parentA: unknown,
    parentB: unknown,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
): boolean {
    const result = comparator?.(a, b, key, parentA, parentB, isCompared);
    if (result !== undefined) {
        return result;
    }

    if (is(a, b)) {
        return true;
    }

    if (!isObject(a) || !isObject(b)) {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
    switch (a.constructor) {
        case RegExp:
            return (
                a.constructor === b.constructor
                && (<RegExp>a).source === (<RegExp>b).source
                && (<RegExp>a).flags === (<RegExp>b).flags
                && (<RegExp>a).lastIndex === (<RegExp>b).lastIndex
            );

        case String:
        case Number:
        case Boolean:
        case Date:
            return (
                a.constructor === b.constructor && is(a.valueOf(), b.valueOf())
            );

        case WeakMap:
        case WeakSet:
        case WeakRef:
            return a === b;
    }

    if (HAS_SHARED_ARRAYBUFFER) {
        if (isSharedArrayBuffer(a)) {
            if (!isSharedArrayBuffer(b) || a.byteLength !== b.byteLength)
                return false;

            return equalTypedArray(new Uint8Array(a), new Uint8Array(b));
        }
    }

    if (isArrayBuffer(a)) {
        if (
            !isArrayBuffer(b)
            || a.detached
            || b.detached
            || a.byteLength !== b.byteLength
        )
            return false;

        return equalTypedArray(new Uint8Array(a), new Uint8Array(b));
    }

    if (isDataView(a)) {
        if (!isDataView(b)) return false;

        if (
            (isArrayBuffer(a) && a.detached)
            || (isArrayBuffer(b) && b.detached)
            || a.byteLength !== b.byteLength
        ) {
            return false;
        }

        return equalTypedArray(
            new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
            new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
        );
    }

    if (isTypedArray(a)) {
        if (!isTypedArray(b)) return false;

        if (
            (isArrayBuffer(a) && a.detached)
            || (isArrayBuffer(b) && b.detached)
            || a.length !== b.length
        ) {
            return false;
        }

        return equalTypedArray(a, b);
    }

    // 以下是可能存在循环引用的对象，需要使用栈来避免无限递归
    if (isCompared(a, b)) {
        return true;
    }

    if (isArray(a)) {
        if (!isArray(b) || a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++) {
            if (!_equal(a[i], b[i], i, a, b, ignorePrototype, comparator)) {
                return false;
            }
        }
        return true;
    }

    if (isMap(a)) {
        if (!isMap(b) || a.size !== b.size) return false;

        for (const [key, value] of a) {
            if (
                !b.has(key)
                || !_equal(
                    value,
                    b.get(key),
                    key,
                    a,
                    b,
                    ignorePrototype,
                    comparator,
                )
            ) {
                return false;
            }
        }

        return true;
    }

    if (isSet(a)) {
        if (!isSet(b) || a.size !== b.size) return false;

        const aValues = Array.from(a);
        const bValues = Array.from(b);

        for (let i = 0; i < aValues.length; i++) {
            const aValue = aValues[i];
            const index = bValues.findIndex(bValue => {
                return _equal(
                    aValue,
                    bValue,
                    undefined,
                    a,
                    b,
                    ignorePrototype,
                    comparator,
                );
            });

            if (index === -1) {
                return false;
            }

            bValues.splice(index, 1);
        }

        return true;
    }

    if (isError(a)) {
        if (!isError(b)) return false;

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (a.constructor) {
            case SuppressedError: {
                if ((<SuppressedError>a).constructor !== b.constructor)
                    return false;

                if (
                    !_equal(
                        (<SuppressedError>a).error,
                        (<SuppressedError>b).error,
                        "error",
                        a,
                        b,
                        ignorePrototype,
                        comparator,
                    )
                    || !_equal(
                        (<SuppressedError>a).suppressed,
                        (<SuppressedError>b).suppressed,
                        "suppressed",
                        a,
                        b,
                        ignorePrototype,
                        comparator,
                    )
                ) {
                    return false;
                }

                break;
            }

            case AggregateError: {
                if ((<AggregateError>a).constructor !== b.constructor)
                    return false;

                const result = _equal(
                    (<AggregateError>a).errors,
                    (<AggregateError>b).errors,
                    "errors",
                    a,
                    b,
                    ignorePrototype,
                    comparator,
                );

                if (!result) {
                    return false;
                }

                break;
            }
        }

        return (
            a.name === b.name
            && a.message === b.message
            && _equal(
                a.cause,
                b.cause,
                "cause",
                a,
                b,
                ignorePrototype,
                comparator,
            )
        );
    }

    return equalObject(a, b, ignorePrototype, comparator);
}

function isCompared(a: object, b: object) {
    if (stack.get(a) === b) return true;
    stack.set(a, b);
    return false;
}

function equalTypedArray(a: TypedArray, b: TypedArray) {
    for (let i = 0; i < a.length; i++) {
        if (!is(a[i], b[i])) {
            return false;
        }
    }
    return true;
}

function equalObject(
    a: object,
    b: object,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isEquatable(a)) {
        return a[Symbol.equal](b, isCompared);
    }

    if (isEquatable(b)) {
        return b[Symbol.equal](a, isCompared);
    }

    if (!ignorePrototype && getPrototype(a) !== getPrototype(b)) {
        return false;
    }

    const aKeys = getOwnProperties(a);
    const bKeys = getOwnProperties(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i];
        const value = (<checked>a)[key];

        if (!hasOwnProperty(b, key)) {
            return false;
        }

        if (
            !_equal(
                value,
                (<checked>b)[key],
                key,
                a,
                b,
                ignorePrototype,
                comparator,
            )
        ) {
            return false;
        }
    }

    return true;
}
