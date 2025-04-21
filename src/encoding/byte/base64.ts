import { isString } from "../../utils/guard.js";
import { asUint8Array } from "../../utils/typed-array.js";
import { textEncoding } from "../text.js";
import type { Base64DecodeOptions, Base64EncodeOptions } from "./options.js";
import * as unit8 from "./unit8.js";

const encodeTable =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const encodeUrlTable =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// 存储的值为对应的 Base64 索引值（0-63），填充 0xFF 表示无效的 Base64 字符
const decodeTable = new Uint8Array([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 62, 0xff, 62, 0xff, 63, 52, 53,
    54, 55, 56, 57, 58, 59, 60, 61, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 0xff, 0xff, 0xff, 0xff, 63, 0xff, 26, 27, 28, 29, 30, 31,
    32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
    51, 0xff, 0xff, 0xff, 0xff, 0xff,
]);

// 用于移除所有空白字符
const whitespaceRegex = /\s+/gu;

// 任意填充，不支持变体
const verifyRegex =
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}(==)?|[A-Za-z0-9+/]{3}(=)?)?$/u;
// 任意填充，支持变体
const verifyAnyRegex =
    /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}(==)?|[A-Za-z0-9+/\-_]{3}(=)?)?$/u;

// 必须填充，不支持变体
const verifyPadRegex =
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

// 必须填充，支持变体
const verifyAnyAndPadRegex =
    /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}==|[A-Za-z0-9+/\-_]{3}=)?$/u;

// 禁止填充，不支持变体
const verifyNoPadRegex =
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}|[A-Za-z0-9+/]{3})?$/u;
// 禁止填充，支持变体
const verifyAnyAndNoPadRegex =
    /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}|[A-Za-z0-9+/\-_]{3})?$/u;

/**
 * 将字节数据编码为 Base64 字符串
 *
 * @param bytes 字节数据
 * @param opts {@link Base64EncodeOptions}
 * @returns Base64 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Base64EncodeOptions,
): string {
    return _encode(bytes, false, opts);
}

/**
 * @internal
 */
export function _encode(
    bytes: string | BufferSource,
    urlSafe: boolean,
    opts?: Base64EncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(
                textEncoding.encode(bytes, encoding, opts?.encodingOptions),
                opts,
            );
        } else {
            return encode(unit8.decode(bytes, opts), opts);
        }
    } else {
        const data = asUint8Array(bytes);
        const len = data.length;
        const table = urlSafe ? encodeUrlTable : encodeTable;
        const padding = opts?.padding ?? true;

        let resultLength = Math.floor(len / 3) * 4;

        // 处理最后的余数部分
        const remainder = len % 3;
        if (remainder > 0) {
            // 每个余数字节需要额外的编码字符
            resultLength += remainder + 1;
            // 如果需要填充，添加填充字符数量
            if (padding) {
                resultLength += 3 - remainder;
            }
        }

        const result = new Array<string>(resultLength);
        let resultIndex = 0;
        let i = 0;

        // 处理完整的 3 字节块
        for (; i + 2 < len; i += 3) {
            const n = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
            result[resultIndex++] = table[(n >> 18) & 63];
            result[resultIndex++] = table[(n >> 12) & 63];
            result[resultIndex++] = table[(n >> 6) & 63];
            result[resultIndex++] = table[n & 63];
        }

        // 处理余下的字节
        if (i < len) {
            let n = data[i] << 16;
            if (i + 1 < len) {
                n |= data[i + 1] << 8;
            }

            result[resultIndex++] = table[(n >> 18) & 63];
            result[resultIndex++] = table[(n >> 12) & 63];

            if (i + 1 < len) {
                result[resultIndex++] = table[(n >> 6) & 63];
                if (padding) {
                    result[resultIndex++] = "=";
                }
            } else {
                if (padding) {
                    result[resultIndex++] = "=";
                    result[resultIndex++] = "=";
                }
            }
        }

        return result.join("");
    }
}

/**
 * 将 Base64 字符串解码为字节数据
 *
 * @param text Base64 字符串
 * @param opts {@link Base64DecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: Base64DecodeOptions): Uint8Array {
    text = text.replace(whitespaceRegex, "");

    const len = text.length;
    const fatal = opts?.fatal ?? true;

    // 计算填充长度
    let padLength = 0;

    if (len > 0) {
        if (text.charAt(len - 1) === "=") {
            padLength++;
            if (text.charAt(len - 2) === "=") {
                padLength++;
            }
        } else {
            // 处理无填充情况下的隐含填充长度
            const remainder = len % 4;
            if (remainder !== 0) {
                // 如果长度不是 4 的倍数，计算隐含的填充数量
                padLength = 4 - remainder;
            }
        }
    }

    // 计算结果字节数组长度
    const outputLength = Math.floor((len * 3) / 4) - padLength;
    const result = new Uint8Array(outputLength);

    let resultIndex = 0;
    let i = 0;

    // 处理完整的 4 字节组
    const completeGroups = Math.floor(len / 4);
    for (let groupIndex = 0; groupIndex < completeGroups; groupIndex++) {
        // 获取 4 个字符对应的 6 位值
        const a = decodeChar(text.charCodeAt(i), fatal, i);
        i++;
        const b = decodeChar(text.charCodeAt(i), fatal, i);
        i++;
        const c = decodeChar(text.charCodeAt(i), fatal, i);
        i++;
        const d = decodeChar(text.charCodeAt(i), fatal, i);
        i++;

        // 组合成 3 个字节
        const n = (a << 18) | (b << 12) | (c << 6) | d;

        // 写入结果数组
        result[resultIndex++] = (n >> 16) & 0xff;
        result[resultIndex++] = (n >> 8) & 0xff;
        result[resultIndex++] = n & 0xff;
    }

    // 处理剩余的不完整组（当字符串长度不是 4 的倍数时）
    const remainingChars = len % 4;
    if (remainingChars > 0) {
        // 必须至少有两个字符才能解码一个字节
        if (remainingChars < 2) {
            if (fatal) {
                throw new RangeError(
                    "invalid Base64 string: too few characters in the final group",
                );
            } else {
                return result;
            }
        }

        // 获取剩余字符对应的 6 位值
        const a = decodeChar(text.charCodeAt(i), fatal, i);
        i++;
        const b = decodeChar(text.charCodeAt(i), fatal, i);
        i++;

        // 组合成字节
        const n = (a << 18) | (b << 12);

        // 写入结果数组
        result[resultIndex++] = (n >> 16) & 0xff;

        // 如果有第三个字符，继续解码
        if (remainingChars > 2) {
            const c = decodeChar(text.charCodeAt(i), fatal, i);
            i++;
            const n2 = n | (c << 6);
            result[resultIndex++] = (n2 >> 8) & 0xff;
        }
    }

    return result;
}

/**
 * @param text 字符串
 * @param anyVariant 是否允许变体，默认为 `true`
 * @param padding 是否检查填充符，默认为 `undefined`，表示不检查，`true` 则强制必要的填充符，`false` 则强制禁止填充符
 * @returns 返回是否为有效的 Base64 字符串
 */
export function verify(
    text: string,
    anyVariant: boolean = true,
    padding?: boolean,
): boolean {
    text = text.replace(whitespaceRegex, "");

    if (text.length === 0) {
        return false;
    }

    if (anyVariant) {
        if (padding === true) {
            return verifyAnyAndPadRegex.test(text);
        } else if (padding === false) {
            return verifyAnyAndNoPadRegex.test(text);
        } else {
            return verifyAnyRegex.test(text);
        }
    } else {
        if (padding === true) {
            return verifyPadRegex.test(text);
        } else if (padding === false) {
            return verifyNoPadRegex.test(text);
        } else {
            return verifyRegex.test(text);
        }
    }
}

function decodeChar(charCode: number, fatal: boolean, offset: number): number {
    if (charCode < 0 || charCode > 127) {
        if (fatal) {
            throwInvalidCharError(charCode, offset);
        } else {
            return 0x00;
        }
    }
    const val = decodeTable[charCode];
    if (val === 0xff) {
        if (fatal) {
            throwInvalidCharError(charCode, offset);
        } else {
            return 0x00;
        }
    }
    return val;
}

function throwInvalidCharError(charCode: number, offset: number) {
    throw new RangeError(
        `invalid Base64 character at position ${offset}: ${String.fromCharCode(charCode)}(${charCode}).`,
    );
}
