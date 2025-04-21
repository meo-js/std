import { TextEncoding } from "./enum.js";
import type {
    TextDecodeSingleByteOptions,
    TextEncodeSingleByteOptions,
} from "./options.js";
import { _decode, _encode, _isWellFormed, _verify } from "./single-byte.js";

const maxCode = 127;

/**
 * 以 Ascii 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link TextDecodeSingleByteOptions}
 * @returns 字符串
 */
export function decode(
    bytes: BufferSource,
    opts?: TextDecodeSingleByteOptions,
): string {
    return _decode(maxCode, TextEncoding.Ascii, bytes, opts);
}

/**
 * 编码字符串为 Ascii 字节数据
 *
 * @param text 字符串
 * @param opts {@link TextEncodeSingleByteOptions}
 * @returns Ascii 字节数据
 */
export function encode(
    text: string,
    opts?: TextEncodeSingleByteOptions,
): Uint8Array {
    return _encode(maxCode, TextEncoding.Ascii, text, opts);
}

/**
 * 验证是否为有效的 Ascii 字节数据
 *
 * @param bytes 字节数据
 * @returns 是否为有效的 Ascii 编码
 */
export function verify(bytes: BufferSource): boolean {
    return _verify(maxCode, bytes);
}

/**
 * @param text 要检查的字符串
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A` `U+FFFD`
 * @returns 是否是有效的 Ascii 字符串
 */
export function isWellFormed(
    text: string,
    allowReplacementChar: boolean = true,
): boolean {
    return _isWellFormed(maxCode, text, allowReplacementChar);
}
