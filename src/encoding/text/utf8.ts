import { asUint8Array, Endian } from "../../typed-array.js";
import { throwInvalidChar, throwInvalidSurrogate } from "../error.js";
import * as decodeFallback from "./decode-fallback.js";
import * as encodeFallback from "./encode-fallback.js";
import { Encoding } from "./enum.js";
import type { SingleByteDecodeOptions, Utf8EncodeOptions } from "./options.js";
import { replacementCharRegex } from "./replacement-char.js";

const bom = [0xef, 0xbb, 0xbf];

/**
 * 以 UTF-8 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link SingleByteDecodeOptions}
 * @returns 字符串
 */
export function decode(
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): string {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;

    const data = asUint8Array(bytes);

    if (data.length === 0) {
        return "";
    }

    // 检查是否有 BOM
    let offset = 0;
    if (
        data.length >= 3
        && data[0] === bom[0]
        && data[1] === bom[1]
        && data[2] === bom[2]
    ) {
        offset = 3;
    }

    let str = "";

    while (offset < data.length) {
        const byte1 = data[offset];

        // Ascii 字符
        if ((byte1 & 0x80) === 0) {
            str += String.fromCharCode(byte1);
            offset += 1;
            continue;
        }

        // 确定 UTF-8 序列的长度 2-4
        let seqLen = 0;
        if ((byte1 & 0xe0) === 0xc0) seqLen = 2;
        else if ((byte1 & 0xf0) === 0xe0) seqLen = 3;
        else if ((byte1 & 0xf8) === 0xf0) seqLen = 4;
        else {
            // 无效的首字节
            if (fatal) {
                throwInvalidSurrogate(byte1, offset);
            } else {
                str += fallback(data, offset, Endian.Little, Encoding.Utf8);
                offset += 1;
                continue;
            }
        }

        // 检查序列长度是否超出范围
        if (offset + seqLen > data.length) {
            if (fatal) {
                throwInvalidSurrogate(byte1, offset);
            } else {
                str += fallback(data, offset, Endian.Little, Encoding.Utf8);
                break;
            }
        }

        // 验证后续字节
        const originalOffset = offset;
        let codePoint = 0;
        for (let i = 1; i < seqLen; i++) {
            const byte = data[originalOffset + i];
            offset += 1;
            if ((byte & 0xc0) !== 0x80) {
                codePoint = -1;
                break;
            } else {
                codePoint = (codePoint << 6) | (byte & 0x3f);
            }
        }

        if (codePoint === -1) {
            if (fatal) {
                throwInvalidSurrogate(byte1, originalOffset);
            } else {
                str += fallback(
                    data,
                    originalOffset,
                    Endian.Little,
                    Encoding.Utf8,
                );
                offset = originalOffset + 1;
                continue;
            }
        }

        // 与首字节有效位组合
        offset += 1;
        if (seqLen === 2) {
            codePoint = ((byte1 & 0x1f) << 6) | codePoint;
        } else if (seqLen === 3) {
            codePoint = ((byte1 & 0x0f) << 12) | codePoint;
        } else if (seqLen === 4) {
            codePoint = ((byte1 & 0x07) << 18) | codePoint;
        }

        // 检查所有无效情况
        if (
            (seqLen === 2 && codePoint <= 0x7f)
            || (seqLen === 3 && codePoint <= 0x7ff)
            || (seqLen === 4 && codePoint <= 0xffff)
            || (codePoint >= 0xd800 && codePoint <= 0xdfff)
            || codePoint > 0x10ffff
        ) {
            if (fatal) {
                throwInvalidChar(codePoint, originalOffset);
            } else {
                str += fallback(
                    data,
                    originalOffset,
                    Endian.Little,
                    Encoding.Utf8,
                );
                continue;
            }
        }

        // 将码点转换为字符串
        if (codePoint <= 0xffff) {
            str += String.fromCharCode(codePoint);
        } else {
            const highSurrogate =
                Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
            const lowSurrogate = ((codePoint - 0x10000) % 0x400) + 0xdc00;
            str += String.fromCharCode(highSurrogate, lowSurrogate);
        }
    }

    return str;
}

/**
 * 编码字符串为 UTF-8 字节数据
 *
 * @param text 字符串
 * @param opts {@link Utf8EncodeOptions}
 * @returns UTF-8 字节数据
 */
export function encode(text: string, opts?: Utf8EncodeOptions): Uint8Array {
    const addBom = opts?.bom ?? false;
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? encodeFallback.replace;

    const chars: number[] = [];

    if (addBom) {
        chars.push(...bom);
    }

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);

        // 处理代理对
        if (
            (code >= 0xd800 && code <= 0xdbff)
            || (code >= 0xdc00 && code <= 0xdfff)
        ) {
            if (code >= 0xd800 && code <= 0xdbff) {
                // 检查匹配的低代理项
                if (i + 1 < text.length) {
                    const lowCode = text.charCodeAt(i + 1);
                    if (lowCode >= 0xdc00 && lowCode <= 0xdfff) {
                        const codePoint =
                            (code - 0xd800) * 0x400
                            + (lowCode - 0xdc00)
                            + 0x10000;

                        chars.push(0xf0 | ((codePoint >> 18) & 0x07));
                        chars.push(0x80 | ((codePoint >> 12) & 0x3f));
                        chars.push(0x80 | ((codePoint >> 6) & 0x3f));
                        chars.push(0x80 | (codePoint & 0x3f));
                        i++;
                        continue;
                    }
                }

                if (fatal) {
                    throwInvalidSurrogate(code, i);
                } else {
                    chars.push(fallback(text, i, Endian.Little, Encoding.Utf8));
                }
            } else {
                // 孤立的低代理项
                if (fatal) {
                    throwInvalidSurrogate(code, i);
                } else {
                    chars.push(fallback(text, i, Endian.Little, Encoding.Utf8));
                }
            }
        } else {
            // 正常字符
            if (code <= 0x7f) {
                chars.push(code);
            } else if (code <= 0x7ff) {
                chars.push(0xc0 | ((code >> 6) & 0x1f));
                chars.push(0x80 | (code & 0x3f));
            } else {
                chars.push(0xe0 | ((code >> 12) & 0x0f));
                chars.push(0x80 | ((code >> 6) & 0x3f));
                chars.push(0x80 | (code & 0x3f));
            }
        }
    }

    return new Uint8Array(chars);
}

/**
 * 验证是否为有效的 UTF-8 字节数据
 *
 * @param bytes 字节数据
 * @returns 是否为有效的 UTF-8 编码
 */
export function verify(bytes: BufferSource): boolean {
    const data = asUint8Array(bytes);

    if (data.length === 0) {
        return true;
    }

    // 检查是否有 BOM
    let offset = 0;
    if (
        data.length >= 3
        && data[0] === bom[0]
        && data[1] === bom[1]
        && data[2] === bom[2]
    ) {
        offset = 3;
    }

    while (offset < data.length) {
        const byte1 = data[offset];

        // Ascii 字符
        if ((byte1 & 0x80) === 0) {
            offset += 1;
            continue;
        }

        // 确定 UTF-8 序列的长度 2-4
        let seqLen = 0;
        if ((byte1 & 0xe0) === 0xc0) seqLen = 2;
        else if ((byte1 & 0xf0) === 0xe0) seqLen = 3;
        else if ((byte1 & 0xf8) === 0xf0) seqLen = 4;
        else {
            // 无效的首字节
            return false;
        }

        // 检查序列长度是否超出范围
        if (offset + seqLen > data.length) {
            return false;
        }

        // 验证后续字节
        const originalOffset = offset;
        let codePoint = 0;
        for (let i = 1; i < seqLen; i++) {
            const byte = data[originalOffset + i];
            offset += 1;
            if ((byte & 0xc0) !== 0x80) {
                return false;
            } else {
                codePoint = (codePoint << 6) | (byte & 0x3f);
            }
        }

        // 与首字节有效位组合
        offset += 1;
        if (seqLen === 2) {
            codePoint = ((byte1 & 0x1f) << 6) | codePoint;
        } else if (seqLen === 3) {
            codePoint = ((byte1 & 0x0f) << 12) | codePoint;
        } else if (seqLen === 4) {
            codePoint = ((byte1 & 0x07) << 18) | codePoint;
        }

        // 检查所有无效情况
        if (
            (seqLen === 2 && codePoint <= 0x7f)
            || (seqLen === 3 && codePoint <= 0x7ff)
            || (seqLen === 4 && codePoint <= 0xffff)
            || (codePoint >= 0xd800 && codePoint <= 0xdfff)
            || codePoint > 0x10ffff
        ) {
            return false;
        }
    }

    return true;
}

/**
 * @param text 要检查的字符串
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A` `U+FFFD`
 * @returns 是否是格式良好的 UTF-8 字符串
 */
export function isWellFormed(
    text: string,
    allowReplacementChar: boolean = true,
): boolean {
    // 在 JavaScript 中，所有字符串内部都已是 UTF-16 编码，仅需检查未配对的代理项
    if (!text.isWellFormed()) {
        return false;
    }
    return allowReplacementChar ? true : !replacementCharRegex.test(text);
}
