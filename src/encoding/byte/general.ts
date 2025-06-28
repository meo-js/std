import { throwUnsupportedEncoding } from "../error.js";
import * as base64Url from "./base64-url.js";
import * as base64 from "./base64.js";
import { Encoding } from "./enum.js";
import * as hex from "./hex.js";
import type { DecodeOptions, EncodeOptions } from "./options.js";

/**
 * 字节数据验证选项
 */
export interface VerifyOptions {
    /**
     * 是否允许变体（仅适用于 Base64/Base64Url）
     *
     * @default true
     */
    allowVariant?: boolean;
    /**
     * 填充符选项（仅适用于 Base64/Base64Url）
     *
     * @default undefined 表示不检查，true 则强制必要的填充符，false 则强制禁止填充符
     */
    padding?: boolean;
}

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
