import { isString } from "../../utils/guard.js";
import { asUint8Array } from "../../utils/typed-array.js";
import { textEncoding } from "../text.js";
import type { Uint8EncodeOptions } from "./options.js";

/**
 * 将字节数据编码为字符串
 *
 * 该函数使用 {@link String.fromCharCode} 编码每个字节为一个字符。
 *
 * @param bytes 字节数据
 * @param opts {@link Uint8EncodeOptions}
 * @returns 字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: Uint8EncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(textEncoding.encode(bytes, encoding), opts);
        } else {
            return bytes;
        }
    } else {
        const data = asUint8Array(bytes);

        const len = data.length;
        const strs = new Array<string>(len);

        for (let i = 0; i < len; i++) {
            strs[i] = String.fromCharCode(data[i]);
        }

        return strs.join("");
    }
}

/**
 * 将字符串解码为字节数据
 *
 * 该函数使用 {@link String.charCodeAt} 编码每个字符为一个字节。
 *
 * @param text 字符串
 * @returns 字节数据
 */
export function decode(text: string): Uint8Array {
    const len = text.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        const code = text.charCodeAt(i);
        if (code > 0xff) {
            throw new RangeError(
                `the character code is out of Uint8 range: ${text[i]}(${code}).`,
            );
        }
        bytes[i] = code;
    }

    return bytes;
}
