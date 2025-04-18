import { isString } from "../../utils/guard.js";
import { asDataView, asUint16Array, Endian } from "../../utils/typed-array.js";
import { textEncoding } from "../text.js";
import type { ByteDecodeOptions, Uint16EncodeOptions } from "./options.js";

/**
 * 将字节数据编码为字符串
 *
 * 该函数使用 {@link String.fromCharCode} 编码每两个字节为一个字符。
 *
 * @param bytes 字节数据
 * @param opts {@link Uint16EncodeOptions}
 * @returns 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Uint16EncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(textEncoding.encode(bytes, encoding), opts);
        } else {
            return bytes;
        }
    } else {
        if (bytes.byteLength % 2 !== 0) {
            throw new RangeError(
                `the byte length is not even: ${bytes.byteLength}.`,
            );
        }
        const endian = opts?.endian ?? Endian.Other;
        const len = Math.floor(bytes.byteLength / 2);
        const strs = new Array<string>(len);

        if (endian === Endian.Other) {
            const data = asUint16Array(bytes);

            for (let index = 0; index < len; index++) {
                const element = data[index];
                strs[index] = String.fromCharCode(element);
            }
        } else {
            const data = asDataView(bytes);
            const little = endian === Endian.Little;

            for (let index = 0; index < len; index++) {
                const element = data.getUint16(index * 2, little);
                strs[index] = String.fromCharCode(element);
            }
        }
        return strs.join("");
    }
}

/**
 * 将字符串解码为字节数据
 *
 * 该函数使用 {@link String.charCodeAt} 编码每个字符为两个字节。
 *
 * @param text 字符串
 * @param opts {@link ByteDecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: ByteDecodeOptions): Uint8Array {
    const len = text.length;
    const bytes = new Uint8Array(len * 2);
    const endian = opts?.endian ?? Endian.Other;

    if (endian === Endian.Other) {
        const data = asUint16Array(bytes);
        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);
            data[i] = code;
        }
    } else {
        const view = asDataView(bytes);
        const little = endian === Endian.Little;

        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);
            view.setUint16(i * 2, code, little);
        }
    }

    return bytes;
}
