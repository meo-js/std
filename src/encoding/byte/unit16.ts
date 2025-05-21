import { isString } from "../../predicate.js";
import { fromCharCodes } from "../../string.js";
import {
    asDataView,
    asUint16Array,
    Endian,
    getBufferInfo,
} from "../../typed-array.js";
import { throwInvalidLength } from "../error.js";
import * as text from "../text.js";
import type { Unit16DecodeOptions, Unit16EncodeOptions } from "./options.js";

/**
 * 将字节数据编码为字符串
 *
 * 该函数使用 {@link String.fromCharCode} 编码每两个字节为一个字符。
 *
 * @param bytes 字节数据
 * @param opts {@link Unit16EncodeOptions}
 * @returns 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Unit16EncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(
                text.encode(bytes, encoding, opts?.encodingOptions),
                opts,
            );
        } else {
            return bytes;
        }
    } else {
        const fatal = opts?.fatal ?? true;

        let hasInvalidData = false;
        if (bytes.byteLength % 2 !== 0) {
            if (fatal) {
                throwInvalidLength(bytes.byteLength, "even");
            } else {
                hasInvalidData = true;
            }
        }

        const endian = opts?.endian;

        if (endian == null) {
            if (hasInvalidData) {
                const info = getBufferInfo(bytes);
                info.byteLength = Math.floor(info.byteLength / 2);
                const data = new Uint16Array(...info.params);
                return fromCharCodes(data);
            } else {
                const data = asUint16Array(bytes);
                return fromCharCodes(data);
            }
        } else {
            const data = asDataView(bytes);
            const big = endian === Endian.Big;
            const len = Math.floor(bytes.byteLength / 2);
            let str = "";

            for (let index = 0; index < len; index++) {
                const element = data.getUint16(index * 2, !big);
                str += String.fromCharCode(element);
            }

            return str;
        }
    }
}

/**
 * 将字符串解码为字节数据
 *
 * 该函数使用 {@link String.charCodeAt} 编码每个字符为两个字节。
 *
 * @param text 字符串
 * @param opts {@link Unit16DecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: Unit16DecodeOptions): Uint8Array {
    const len = text.length;
    const bytes = new Uint8Array(len * 2);
    const endian = opts?.endian ?? Endian.Unknown;

    if (endian === Endian.Unknown) {
        const data = asUint16Array(bytes);
        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);
            data[i] = code;
        }
    } else {
        const view = asDataView(bytes);
        const big = endian === Endian.Big;

        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i);
            view.setUint16(i * 2, code, !big);
        }
    }

    return bytes;
}
