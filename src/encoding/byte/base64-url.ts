import { Pipe } from "../../pipe.js";
import * as base64 from "./base64.js";
import type { Base64DecodeOptions, Base64EncodeOptions } from "./options.js";
import { _decodeInto } from "./shared.js";

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
 * @param opts {@link Base64DecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: Base64DecodeOptions): Uint8Array {
    return base64.decode(text, opts);
}

/**
 * 将 Base64 Url 字符串解码到指定的缓冲区中
 *
 * @param text Base64 Url 字符串
 * @param out 输出缓冲区
 * @param opts {@link Base64DecodeOptions}
 * @returns 返回一个对象，包含已读取的字符数量和写入缓冲区的字节数
 */
export function decodeInto(
    text: string,
    out: BufferSource,
    opts?: Base64DecodeOptions,
): { read: number; written: number } {
    return _decodeInto(
        text,
        out,
        decodePipe(opts),
        base64.measureSize(text),
        3,
    );
}

/**
 * @param text 字符串
 * @param allowVariant 是否允许变体，默认为 `true`
 * @param padding 是否检查填充符，默认为 `undefined`，表示不检查，`true` 则强制必要的填充符，`false` 则强制禁止填充符
 * @returns 返回是否为有效的 Base64 Url 字符串
 */
export function verify(
    text: string,
    allowVariant: boolean = true,
    padding?: boolean,
): boolean {
    if (allowVariant) {
        return base64.verify(text, true, padding);
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

/**
 * 计算字节数据编码为 Base64 字符串的精确长度
 */
export function measureLength(bytes: BufferSource, padding: boolean): number {
    return base64.measureLength(bytes, padding);
}

/**
 * 计算 Base64 字符串解码为字节数据的精确长度
 *
 * 注意：仅当解码时 `fatal` 为 `true` 且未抛出错误时，该函数计算的长度才绝对准确，否则返回的长度为最大长度。
 */
export function measureSize(text: string): number {
    return base64.measureSize(text);
}

/**
 * 创建一个编码字节数据为 Base64 Url 字符串的管道
 */
export function encodePipe(opts?: Base64EncodeOptions) {
    return Pipe.create(new base64.EncodePipe(true, opts));
}

/**
 * 创建一个解码 Base64 Url 字符串为字节数据的管道
 */
export function decodePipe(opts?: Base64DecodeOptions) {
    return base64.decodePipe(opts);
}

/**
 * 创建一个验证 Base64 Url 字符串有效性的管道
 */
export function verifyPipe(allowVariant: boolean = true, padding?: boolean) {
    return base64.verifyPipe(allowVariant, padding);
}
