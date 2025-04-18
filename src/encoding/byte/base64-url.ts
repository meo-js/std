import * as base64 from "./base64.js";
import type { Base64EncodeOptions } from "./options.js";

// 用于移除所有空白字符
const whitespaceRegex = /\s+/gu;

// 必须填充
const verifyPadRegex =
    /^([A-Za-z0-9\-_]{4})*([A-Za-z0-9\-_]{2}==|[A-Za-z0-9\-_]{3}=)?$/u;

// 禁止填充
const verifyNoPadRegex =
    /^([A-Za-z0-9\-_]{4})*([A-Za-z0-9\-_]{2}|[A-Za-z0-9\-_]{3})?$/u;

// 任意填充
const verifyRegex =
    /^([A-Za-z0-9\-_]{4})*([A-Za-z0-9\-_]{2}(==)?|[A-Za-z0-9\-_]{3}(=)?)?$/u;

/**
 * 将字节数据编码为 Base64 Url 字符串
 *
 * @param bytes 字节数据
 * @param opts {@link Base64EncodeOptions}
 * @returns Base64 Url 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Base64EncodeOptions,
): string {
    return base64._encode(bytes, true, opts);
}

/**
 * 将 Base64 Url 字符串解码为字节数据
 *
 * @param text Base64 Url 字符串
 * @returns 字节数据
 */
export function decode(text: string): Uint8Array {
    return base64.decode(text);
}

/**
 * @param text 字符串
 * @param anyVariant 是否允许变体，默认为 `true`
 * @param padding 是否检查填充符，默认为 `undefined`，表示不检查，`true` 则强制必要的填充符，`false` 则强制禁止填充符
 * @returns 返回是否为有效的 Base64 Url 字符串
 */
export function verify(
    text: string,
    anyVariant: boolean = true,
    padding?: boolean,
): boolean {
    if (anyVariant) {
        return base64.verify(text, true, padding);
    } else {
        text = text.replace(whitespaceRegex, "");

        if (text.length === 0) {
            return false;
        }

        if (padding === true) {
            return verifyPadRegex.test(text);
        } else if (padding === false) {
            return verifyNoPadRegex.test(text);
        } else {
            return verifyRegex.test(text);
        }
    }
}
