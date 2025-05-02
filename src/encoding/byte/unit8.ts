import { isString } from "../../guard.js";
import { fromCharCodes } from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import { throwInvalidChar } from "../error.js";
import { textEncoding } from "../text.js";
import type { Unit8DecodeOptions, Unit8EncodeOptions } from "./options.js";

/**
 * 将字节数据编码为字符串
 *
 * 该函数使用 {@link String.fromCharCode} 编码每个字节为一个字符。
 *
 * @param bytes 字节数据
 * @param opts {@link Unit8EncodeOptions}
 * @returns 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Unit8EncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(
                textEncoding.encode(bytes, encoding, opts?.encodingOptions),
                opts,
            );
        } else {
            const fatal = opts?.fatal ?? true;
            if (fatal) {
                for (let i = 0; i < bytes.length; i++) {
                    const code = bytes.charCodeAt(i);
                    if (code > 0xff) {
                        throwInvalidChar(code, i);
                    }
                }
            }
            return bytes;
        }
    } else {
        const data = asUint8Array(bytes);
        return fromCharCodes(data);
    }
}

/**
 * 将字符串解码为字节数据
 *
 * 该函数使用 {@link String.charCodeAt} 编码每个字符为一个字节。
 *
 * @param text 字符串
 * @param opts {@link Unit8DecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: Unit8DecodeOptions): Uint8Array {
    const len = text.length;
    const bytes = new Uint8Array(len);
    const fatal = opts?.fatal ?? true;

    if (fatal) {
        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);
            if (code > 0xff) {
                throwInvalidChar(code, i);
            } else {
                bytes[i] = code;
            }
        }
    } else {
        for (let i = 0; i < len; i++) {
            bytes[i] = text.charCodeAt(i);
        }
    }

    return bytes;
}
