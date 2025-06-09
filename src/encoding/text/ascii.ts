import type {
    SingleByteDecodeOptions,
    SingleByteEncodeOptions,
} from "./options.js";
import { _decode, _encode, _isWellFormed, _verify } from "./single-byte.js";
import * as subtle from "./subtle/ascii.js";

/**
 * 以 Ascii 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link SingleByteDecodeOptions}
 * @returns 字符串
 */
export function decode(
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): string {
    return _decode(subtle.MAX_CODE, bytes, opts);
}

/**
 * 编码字符串为 Ascii 字节数据
 *
 * @param text 字符串
 * @param opts {@link SingleByteEncodeOptions}
 * @returns Ascii 字节数据
 */
export function encode(
    text: string,
    opts?: SingleByteEncodeOptions,
): Uint8Array {
    return _encode(subtle.MAX_CODE, text, opts);
}

/**
 * 验证是否为有效的 Ascii 字节数据
 *
 * @param bytes 字节数据
 * @returns 是否为有效的 Ascii 编码
 */
export function verify(bytes: BufferSource): boolean {
    return _verify(subtle.MAX_CODE, bytes);
}

/**
 * @param text 要检查的字符串
 * @returns 是否是有效的 Ascii 字符串
 */
export function isWellFormed(text: string): boolean {
    return _isWellFormed(subtle.MAX_CODE, text);
}

export {
    /**
     * Ascii 底层 API
     */
    subtle,
};
