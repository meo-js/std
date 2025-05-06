/**
 * @public
 *
 * @module
 */
import { MAX_CALLSTACK_SIZE } from "./callstack.js";
import { isArray, isFunction, isObject } from "./predicate.js";
import type { Rng } from "./protocol.js";
import type { TypedArray } from "./typed-array.js";

// from https://github.com/ai/nanoid
const urlAlphabet =
    "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

/**
 * 与 {@link String.fromCharCode} 作用完全一致，但采用性能最佳的实现方式
 */
export function fromCharCodes(arr: TypedArray | number[]) {
    if (isArray(arr)) {
        if (arr.length > MAX_CALLSTACK_SIZE) {
            // 只能单个进行转换，否则分块必须 slice 数组，这可能很昂贵
            const result = [];
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
                    String.fromCharCode.apply(undefined, chunk as any),
                );
            }
            return result.join("");
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
            return String.fromCharCode.apply(undefined, arr as any);
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
                    String.fromCodePoint.apply(undefined, chunk as any),
                );
            }
            return result.join("");
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
            return String.fromCodePoint.apply(undefined, arr as any);
        }
    }
}

/**
 * 确保字符串有指定前缀
 *
 * @example
 * ```ts
 * prefix("world", "wo"); // "world"
 * prefix("world", "hello"); // "helloworld"
 * ```
 */
export function ensurePrefix(str: string, prefix: string) {
    if (!str.startsWith(prefix)) return prefix + str;
    return str;
}

/**
 * 确保字符串有指定后缀
 *
 * @example
 * ```ts
 * suffix("hello", "lo"); // "hello"
 * suffix("hello", "world"); // "helloworld"
 * ```
 */
export function ensureSuffix(str: string, suffix: string) {
    if (!str.endsWith(suffix)) return str + suffix;
    return str;
}

/**
 * 解析传入字符串中的 `{...}` 模板并返回解析后的结果
 *
 * @example 以索引作为变量
 * ```ts
 * const result = template(
 *     "Hello {0}, My Name is {1}.",
 *     "June",
 *     "Anthony"
 * );
 * // Hello June, My Name is Anthony.
 * ```
 * @example 以标签作为变量
 * ```ts
 * const result = template(
 *     "{greet}! My name is {name}.",
 *     { greet: "Hello", name: "Anthony" }
 * );
 * // Hello! My name is Anthony.
 * ```
 *
 * 以标签作为变量时，可以设置回退值：
 *
 * ```ts
 * const result = template(
 *     "{greet}! My name is {name}.",
 *     { greet: "Hello" },
 *     key => `[unknwon ${key}]`,
 * );
 * // Hello! My name is [unknwon name].
 * ```
 */
export function template(
    str: string,
    object: Record<string | number, string>,
    fallback?: string | ((key: string) => string),
): string;
export function template(str: string, ...args: string[]): string;
export function template(str: string, ...args: unknown[]): string {
    const [arg, fallback] = args;

    if (isObject(arg)) {
        const vars = arg as Record<string | number, string | undefined>;
        return str.replace(/\{(\w+)\}/gu, (_, key: string) => {
            const value =
                vars[key]
                ?? (isFunction<(key: string) => string>(fallback)
                    ? fallback(key)
                    : (fallback as string | undefined));

            return String(value ?? key);
        });
    } else {
        return str.replace(/\{(\d+)\}/gu, (_, key: string) => {
            const index = Number(key);
            if (Number.isSafeInteger(index)) {
                return String(args[index]);
            } else {
                return key;
            }
        });
    }
}

/**
 * 截断字符串
 */
export function truncate(
    str: string,
    len: number,
    suffix: string,
    opts?: { unicode?: boolean },
) {
    // TODO
}

/**
 * 生成随机字符串
 *
 * @param len 长度
 * @param opts {@link opts}
 * @param opts.dict {@inheritdoc opts.dict}
 * @param opts.rng {@inheritdoc opts.rng}
 */
export function randomText(
    len: number = 16,
    opts?: {
        /**
         * 随机字符串的字符集
         *
         * @default "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"
         */
        dict?: string;
        /**
         * 随机数生成函数
         *
         * @default {@link Math.random}
         */
        rng?: Rng;
    },
) {
    const { dict = urlAlphabet, rng = Math.random } = opts ?? {};
    let id = "";
    let i = len;
    const _len = dict.length;
    while (i--) id += dict[(rng() * _len) | 0];
    return id;
}

// TODO type AAA = st.CamelCase;
