import type { WeakCollection } from "../collection.js";
import { HAS_SHARED_ARRAYBUFFER } from "../env.js";
import { eq } from "../math.js";
import { getOwnProperties, hasOwnProperty } from "../object.js";
import {
    isArrayBuffer,
    isFunction,
    isNumeric,
    isObject,
} from "../predicate.js";
import type { Primitive } from "../primitive.js";
import { Symbol, type Equatable } from "../protocol.js";
import type { checked } from "../ts.js";
import type { TypedArray } from "../typed-array.js";

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
     * 是否忽略两者的原型（`prototype`）是否相等
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
 * 该函数与 {@link Object.is} 相似，但对于两个数值会使用 {@link eq} 函数进行比较。
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
 * is(100, 100n); // true
 * ```
 */
export function is(a: unknown, b: unknown): boolean {
    if (isNumeric(a) && isNumeric(b)) {
        return eq(a, b);
    }
    return Object.is(a, b);
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
 * - {@link TypedArray} 会遍历所有元素进行比较，如果任意一方的 {@link TypedArray.buffer buffer} 已分离则不相等。
 * - {@link Array} 会比较所有元素。
 * - {@link Map} 会比较所有键值对。
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

    const aCtor = a.constructor as Function | null | undefined;
    const bCtor = b.constructor as Function | null | undefined;

    // fast path for plain object
    if (
        aCtor === Object
        || aCtor === null
        || bCtor === Object
        || bCtor === null
    ) {
        return equalObject(a, b, ignorePrototype, comparator);
    }

    if (aCtor === bCtor) {
        // fast path for plain array / map / set
        if (aCtor === Array) {
            return equalArray(
                a as unknown[],
                b as unknown[],
                ignorePrototype,
                comparator,
            );
        }

        if (aCtor === Set) {
            return equalSet(
                a as Set<unknown>,
                b as Set<unknown>,
                ignorePrototype,
                comparator,
            );
        }

        if (aCtor === Map) {
            return equalMap(
                a as Map<unknown, unknown>,
                b as Map<unknown, unknown>,
                ignorePrototype,
                comparator,
            );
        }

        if (aCtor === ArrayBuffer) {
            return equalArrayBuffer(a as ArrayBuffer, b as ArrayBuffer);
        }

        if (aCtor === DataView) {
            return equalDataView(a as DataView, b as DataView);
        }

        if (ArrayBuffer.isView(a)) {
            return equalArrayBufferView(a as TypedArray, b as TypedArray);
        }

        if (HAS_SHARED_ARRAYBUFFER && aCtor === SharedArrayBuffer) {
            return equalSharedArrayBuffer(
                a as SharedArrayBuffer,
                b as SharedArrayBuffer,
            );
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (aCtor) {
            case Date:
            case String:
            case Number:
            case Boolean:
                return is(a.valueOf(), b.valueOf());

            case RegExp:
                return (
                    (<RegExp>a).source === (<RegExp>b).source
                    && (<RegExp>a).flags === (<RegExp>b).flags
                    && (<RegExp>a).lastIndex === (<RegExp>b).lastIndex
                );

            case WeakMap:
            case WeakSet:
            case WeakRef:
                return a === b;
        }

        if (aCtor === Error) {
            return equalError(
                a as Error,
                b as Error,
                ignorePrototype,
                comparator,
            );
        }
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
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function equalArray(
    a: unknown[],
    b: unknown[],
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isCompared(a, b)) {
        return true;
    }

    if (a.length !== b.length) return false;

    const len = a.length;
    for (let i = 0; i < len; i++) {
        if (!_equal(a[i], b[i], i, a, b, ignorePrototype, comparator)) {
            return false;
        }
    }
    return true;
}

function equalSet(
    a: Set<unknown>,
    b: Set<unknown>,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isCompared(a, b)) {
        return true;
    }

    if (a.size !== b.size) return false;

    let bCopy = b;

    loop: for (const aValue of a) {
        if (!isObject(aValue)) {
            if (b.has(aValue)) {
                continue loop;
            } else {
                return false;
            }
        } else {
            for (const bValue of bCopy) {
                if (
                    _equal(
                        aValue,
                        bValue,
                        undefined,
                        a,
                        b,
                        ignorePrototype,
                        comparator,
                    )
                ) {
                    if (bCopy === b) {
                        bCopy = new Set(b);
                    }
                    bCopy.delete(bValue);
                    continue loop;
                }
            }
            return false;
        }
    }

    return true;
}

function equalMap(
    a: Map<unknown, unknown>,
    b: Map<unknown, unknown>,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isCompared(a, b)) {
        return true;
    }

    if (a.size !== b.size) return false;

    let bCopy = b;

    loop: for (const [aKey, aValue] of a) {
        if (!isObject(aValue)) {
            if (
                b.has(aKey)
                && _equal(
                    aValue,
                    b.get(aKey),
                    aKey,
                    a,
                    b,
                    ignorePrototype,
                    comparator,
                )
            ) {
                continue loop;
            } else {
                return false;
            }
        } else {
            for (const [bKey, bValue] of bCopy) {
                if (
                    _equal(
                        aKey,
                        bKey,
                        undefined,
                        a,
                        b,
                        ignorePrototype,
                        comparator,
                    )
                    && _equal(
                        aValue,
                        bValue,
                        aKey,
                        a,
                        b,
                        ignorePrototype,
                        comparator,
                    )
                ) {
                    if (bCopy === b) {
                        bCopy = new Map(b);
                    }
                    bCopy.delete(bKey);
                    continue loop;
                }
            }
            return false;
        }
    }

    return true;
}

function equalArrayBuffer(a: ArrayBuffer, b: ArrayBuffer) {
    if (a.detached || b.detached || a.byteLength !== b.byteLength) return false;

    return equalTypedArray(new Uint8Array(a), new Uint8Array(b));
}

function equalDataView(a: DataView, b: DataView) {
    if (
        (isArrayBuffer(a.buffer) && a.buffer.detached)
        || (isArrayBuffer(b.buffer) && b.buffer.detached)
        || a.byteLength !== b.byteLength
    ) {
        return false;
    }

    return equalTypedArray(
        new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
        new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
    );
}

function equalArrayBufferView(a: TypedArray, b: TypedArray) {
    if (
        (isArrayBuffer(a.buffer) && a.buffer.detached)
        || (isArrayBuffer(b.buffer) && b.buffer.detached)
        || a.length !== b.length
    ) {
        return false;
    }

    return equalTypedArray(a, b);
}

function equalSharedArrayBuffer(a: SharedArrayBuffer, b: SharedArrayBuffer) {
    if (a.byteLength !== b.byteLength) return false;

    return equalTypedArray(new Uint8Array(a), new Uint8Array(b));
}

function equalError(
    a: Error,
    b: Error,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isCompared(a, b)) {
        return true;
    }

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
            if ((<AggregateError>a).constructor !== b.constructor) return false;

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
        && _equal(a.cause, b.cause, "cause", a, b, ignorePrototype, comparator)
    );
}

function equalObject(
    a: object,
    b: object,
    ignorePrototype: boolean,
    comparator: Comparator | undefined,
) {
    if (isCompared(a, b)) {
        return true;
    }

    if (isFunction((<Equatable>a)[Symbol.equal])) {
        return (<Equatable>a)[Symbol.equal](b, isCompared);
    }

    if (isFunction((<Equatable>b)[Symbol.equal])) {
        return (<Equatable>b)[Symbol.equal](a, isCompared);
    }

    if (
        !ignorePrototype
        && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)
    ) {
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
