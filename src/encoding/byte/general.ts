import { throwUnsupportedEncoding } from "../error.js";
import * as base64Url from "./base64-url.js";
import * as base64 from "./base64.js";
import { Encoding } from "./enum.js";
import * as hex from "./hex.js";
import type { DecodeOptions, EncodeOptions, VerifyOptions } from "./options.js";

/**
 * 创建一个将字节数据编码为字符串的管道
 */
export function encodePipe(encoding: Encoding, opts?: EncodeOptions) {
    switch (encoding) {
        case Encoding.Hex:
            return hex.encodePipe(opts);
        case Encoding.Base64:
            return base64.encodePipe(opts);
        case Encoding.Base64Url:
            return base64Url.encodePipe(opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 创建一个将字符串解码为字节数据的管道
 */
export function decodePipe(encoding: Encoding, opts?: DecodeOptions) {
    switch (encoding) {
        case Encoding.Hex:
            return hex.decodePipe(opts);
        case Encoding.Base64:
            return base64.decodePipe(opts);
        case Encoding.Base64Url:
            return base64Url.decodePipe(opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 创建一个验证字符串是否为指定编码有效数据的管道
 */
export function verifyPipe(encoding: Encoding, opts?: VerifyOptions) {
    switch (encoding) {
        case Encoding.Hex:
            return hex.verifyPipe();
        case Encoding.Base64:
            return base64.verifyPipe(opts?.allowVariant, opts?.padding);
        case Encoding.Base64Url:
            return base64Url.verifyPipe(opts?.allowVariant, opts?.padding);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 将字节数据编码为字符串
 */
export function encode(
    bytes: string | BufferSource,
    encoding: Encoding,
    opts?: EncodeOptions,
): string {
    switch (encoding) {
        case Encoding.Hex:
            return hex.encode(bytes, opts);
        case Encoding.Base64:
            return base64.encode(bytes, opts);
        case Encoding.Base64Url:
            return base64Url.encode(bytes, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 将字符串解码为字节数据
 */
export function decode(
    text: string,
    encoding: Encoding,
    opts?: DecodeOptions,
): Uint8Array {
    switch (encoding) {
        case Encoding.Hex:
            return hex.decode(text, opts);
        case Encoding.Base64:
            return base64.decode(text, opts);
        case Encoding.Base64Url:
            return base64Url.decode(text, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 将字符串解码到指定的缓冲区中
 *
 * @param text 字符串
 * @param encoding 编码方式
 * @param out 输出缓冲区
 * @param opts {@link DecodeOptions}
 * @returns 返回一个对象，包含已读取的字符数量和写入缓冲区的字节数
 */
export function decodeInto(
    text: string,
    encoding: Encoding,
    out: BufferSource,
    opts?: DecodeOptions,
): { read: number; written: number } {
    switch (encoding) {
        case Encoding.Hex:
            return hex.decodeInto(text, out, opts);
        case Encoding.Base64:
            return base64.decodeInto(text, out, opts);
        case Encoding.Base64Url:
            return base64Url.decodeInto(text, out, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 验证字符串是否为指定编码的有效数据
 */
export function verify(
    text: string,
    encoding: Encoding,
    opts?: VerifyOptions,
): boolean {
    switch (encoding) {
        case Encoding.Hex:
            return hex.verify(text);
        case Encoding.Base64:
            return base64.verify(text, opts?.allowVariant, opts?.padding);
        case Encoding.Base64Url:
            return base64Url.verify(text, opts?.allowVariant, opts?.padding);
        default:
            throwUnsupportedEncoding(encoding);
    }
}
