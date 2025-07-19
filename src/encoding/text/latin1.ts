import type {
    SingleByteDecodeOptions,
    SingleByteEncodeOptions,
} from "./options.js";
import {
    _decode,
    _decodePipe,
    _encode,
    _encodeInto,
    _encodePipe,
    _isWellFormed,
    _isWellFormedPipe,
    _verify,
    _verifyPipe,
} from "./single-byte.js";

/**
 * Latin1 最大码点
 */
export const MAX_CODE = 255;

/**
 * 编码字符串为 Latin1 字节数据
 *
 * @param text 字符串
 * @param opts {@link SingleByteEncodeOptions}
 * @returns Latin1 字节数据
 */
export function encode(
    text: string,
    opts?: SingleByteEncodeOptions,
): Uint8Array {
    return _encode(MAX_CODE, text, opts);
}

/**
 * 编码字符串为 Latin1 字节数据至指定缓冲区
 *
 * @param text 字符串
 * @param out 输出缓冲区
 * @param opts {@link SingleByteEncodeOptions}
 * @returns 返回一个对象，包含已转换的 UTF-16 编码单元数量和写入缓冲区的字节数
 */
export function encodeInto(
    text: string,
    out: BufferSource,
    opts?: SingleByteEncodeOptions,
): { read: number; written: number } {
    return _encodeInto(MAX_CODE, text, out, opts);
}

/**
 * 以 Latin1 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link SingleByteDecodeOptions}
 * @returns 字符串
 */
export function decode(
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): string {
    return _decode(MAX_CODE, bytes, opts);
}

/**
 * 验证是否为有效的 Latin1 字节数据
 *
 * @param bytes 字节数据
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A`，默认 `false`
 * @returns 是否为有效的 Latin1 编码
 */
export function verify(
    bytes: BufferSource,
    allowReplacementChar?: boolean,
): boolean {
    return _verify(MAX_CODE, bytes, allowReplacementChar);
}

/**
 * @param text 要检查的字符串
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A`，默认 `false`
 * @returns 是否是有效的 Latin1 字符串
 */
export function isWellFormed(
    text: string,
    allowReplacementChar?: boolean,
): boolean {
    return _isWellFormed(MAX_CODE, text, allowReplacementChar);
}

/**
 * 创建一个编码字符码点为 Latin1 字节数据的管道
 */
export function encodePipe(opts?: SingleByteEncodeOptions) {
    return _encodePipe(MAX_CODE, opts);
}

/**
 * 创建一个解码 Latin1 字节数据的管道
 */
export function decodePipe(opts?: SingleByteDecodeOptions) {
    return _decodePipe(MAX_CODE, opts);
}

/**
 * 创建一个验证字节数据是否为有效 Latin1 编码的管道
 */
export function verifyPipe(allowReplacementChar?: boolean) {
    return _verifyPipe(MAX_CODE, allowReplacementChar);
}

/**
 * 创建一个验证字符码点是否能编码为 Latin1 的管道
 */
export function isWellFormedPipe(allowReplacementChar?: boolean) {
    return _isWellFormedPipe(MAX_CODE, allowReplacementChar);
}
