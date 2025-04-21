import { Endian, asDataView, asUint8Array } from "../../utils/typed-array.js";
import {
    throwInvalidLength,
    throwInvalidSurrogate,
    throwUnexpectedEnd,
} from "../error.js";
import type { CodecableEndian } from "../shared.js";
import * as decodeFallback from "./decode-fallback.js";
import * as encodeFallback from "./encode-fallback.js";
import { TextEncoding } from "./enum.js";
import type { TextDecodeOptions, TextEncodeOptions } from "./options.js";
import { replacementCharRegex } from "./replacement-char.js";

const bomCode = 0xfeff;
const reverseBomCode = 0xfffe;

/**
 * 以 UTF-16 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link TextDecodeOptions}
 * @returns 字符串
 */
export function decode(bytes: BufferSource, opts?: TextDecodeOptions): string {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;
    let endian = opts?.endian ?? Endian.Little;

    if (bytes.byteLength === 0) {
        return "";
    }

    // 平台字节序会变，不能直接使用 Uint16Array
    const data = asDataView(bytes);
    const hasInvalidData = data.byteLength % 2 !== 0;

    if (hasInvalidData && fatal) {
        throwInvalidLength(data.byteLength, "even");
    }

    if (data.byteLength === 1) {
        return fallback(data, 0, endian, TextEncoding.Utf16);
    }

    let offset = 0;

    // 检测 BOM
    const bom = data.getUint16(0, true);
    if (bom === bomCode) {
        endian = Endian.Little;
        offset = 2;
    } else if (bom === reverseBomCode) {
        endian = Endian.Big;
        offset = 2;
    }

    // 计算剩余代码单元长度
    const byteLength = data.byteLength - offset;
    const unitLength = Math.floor(byteLength / 2);
    const estimatedSize = hasInvalidData ? unitLength + 1 : unitLength;

    if (estimatedSize > 0) {
        const chars = new Array<string>(estimatedSize);
        const big = endian === Endian.Big;

        let j = 0;

        for (let i = 0; i < unitLength; i++) {
            const pos = offset + i * 2;
            const code = data.getUint16(pos, !big);

            // 是否代理对
            if (
                (code >= 0xd800 && code <= 0xdbff)
                || (code >= 0xdc00 && code <= 0xdfff)
            ) {
                if (code >= 0xd800 && code <= 0xdbff) {
                    // 检查匹配的低代理项
                    if (i + 1 < unitLength) {
                        const lowPos = pos + 2;
                        const lowCode = data.getUint16(lowPos, !big);
                        if (lowCode >= 0xdc00 && lowCode <= 0xdfff) {
                            chars[j++] = String.fromCharCode(code, lowCode);
                            // 跳过低代理项
                            i++;
                            continue;
                        }
                    }

                    if (fatal) {
                        throwInvalidSurrogate(code, pos);
                    } else {
                        chars[j++] = fallback(
                            data,
                            pos,
                            endian,
                            TextEncoding.Utf16,
                        );
                    }
                } else {
                    // 孤立的低代理项
                    if (fatal) {
                        throwInvalidSurrogate(code, pos);
                    } else {
                        chars[j++] = fallback(
                            data,
                            pos,
                            endian,
                            TextEncoding.Utf16,
                        );
                    }
                }
            } else {
                // 正常字符
                chars[j++] = String.fromCharCode(code);
            }
        }

        // 无效的单字节数据
        if (hasInvalidData) {
            if (fatal) {
                throwUnexpectedEnd();
            } else {
                chars[j++] = fallback(
                    data,
                    data.byteLength - 1,
                    endian,
                    TextEncoding.Utf16,
                );
            }
        }

        chars.length = j;

        return chars.join("");
    } else {
        return "";
    }
}

/**
 * 编码字符串为 UTF-16 字节数据
 *
 * @param text 字符串
 * @param opts {@link TextEncodeOptions}
 * @returns UTF-16 字节数据
 */
export function encode(text: string, opts?: TextEncodeOptions): Uint8Array {
    const endian = opts?.endian ?? Endian.Little;
    const addBom = opts?.bom ?? true;
    const big = endian === Endian.Big;
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? encodeFallback.replace;

    const bomLength = addBom ? 2 : 0;
    const unitLength = text.length;
    const bufferLength = unitLength * 2 + bomLength;

    // 平台字节序会变，不能直接使用 Uint16Array
    const data = new DataView(new ArrayBuffer(bufferLength));
    let offset = 0;

    if (addBom) {
        data.setUint16(0, bomCode, !big);
        offset = 2;
    }

    for (let i = 0; i < unitLength; i++) {
        const pos = offset + i * 2;
        const code = text.charCodeAt(i);

        // 是否代理对
        if (
            (code >= 0xd800 && code <= 0xdbff)
            || (code >= 0xdc00 && code <= 0xdfff)
        ) {
            if (code >= 0xd800 && code <= 0xdbff) {
                // 检查匹配的低代理项
                if (i + 1 < unitLength) {
                    const lowPos = i + 1;
                    const lowCode = text.charCodeAt(lowPos);
                    if (lowCode >= 0xdc00 && lowCode <= 0xdfff) {
                        data.setUint16(pos, code, !big);
                        data.setUint16(lowPos, lowCode, !big);
                        i++;
                        continue;
                    }
                }

                if (fatal) {
                    throwInvalidSurrogate(code, i);
                } else {
                    data.setUint16(
                        pos,
                        fallback(text, i, endian, TextEncoding.Utf16),
                        !big,
                    );
                }
            } else {
                // 孤立的低代理项
                if (fatal) {
                    throwInvalidSurrogate(code, i);
                } else {
                    data.setUint16(
                        pos,
                        fallback(text, i, endian, TextEncoding.Utf16),
                        !big,
                    );
                }
            }
        } else {
            data.setUint16(pos, code, !big);
        }
    }

    return asUint8Array(data);
}

/**
 * 检测 UTF-16 字节数据的字节序
 *
 * @param bytes 字节数据
 * @returns 字节序
 */
export function sniff(bytes: BufferSource): Endian {
    const data = asUint8Array(bytes);

    if (data.length < 2) {
        return Endian.Unknown;
    }

    const bom = (data[0] << 8) | data[1];
    if (bom === bomCode) {
        return Endian.Big;
    } else if (bom === reverseBomCode) {
        return Endian.Little;
    } else {
        return Endian.Unknown;
    }
}

/**
 * 验证是否为有效的 UTF-16 字节数据
 *
 * @param bytes 字节数据
 * @param endian 指定字节序，默认会自动检测，若无法检测且未指定则直接返回 `false`
 * @returns 是否为有效的 UTF-16 编码
 */
export function verify(bytes: BufferSource, endian?: CodecableEndian): boolean {
    const data = asDataView(bytes);

    // UTF-16 编码的字节长度必须是偶数
    if (data.byteLength % 2 !== 0) {
        return false;
    }

    // 获取字节序
    let _endian = sniff(data);
    let offset = 0;

    if (_endian !== Endian.Unknown) {
        offset += 2;
    } else {
        _endian = endian ?? Endian.Little;
    }

    const unitLength = (data.byteLength - offset) / 2;
    const big = _endian === Endian.Big;

    for (let i = 0; i < unitLength; i++) {
        const pos = offset + i * 2;

        const code = data.getUint16(pos, !big);

        // 检查是否是高代理项
        if (code >= 0xd800 && code <= 0xdbff) {
            if (i + 1 >= unitLength) {
                return false;
            }

            const lowPos = offset + (i + 1) * 2;
            const lowCode = data.getUint16(lowPos, !big);

            // 检查下一个是否是低代理项
            if (lowCode < 0xdc00 || lowCode > 0xdfff) {
                return false;
            }

            // 跳过已验证的低代理项
            i++;
        } else if (code >= 0xdc00 && code <= 0xdfff) {
            return false;
        }
    }

    return true;
}

/**
 * @param text 要检查的字符串
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A` `U+FFFD`
 * @returns 是否是格式良好的 UTF-16 字符串
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
