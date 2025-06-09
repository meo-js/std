/**
 * @module
 *
 * @moduleTag subtle
 */
import { isSurrogate } from "../../../string.js";
import {
    throwInvalidChar,
    throwInvalidSurrogate,
    throwUnexpectedEnd,
} from "../../error.js";
import type { DecodeFallback } from "../decode-fallback.js";
import { unicodeReplacementCharBytes } from "../replacement-char.js";

/**
 * UTF-8 BOM
 */
export const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

/**
 * 精确测量 Unicode 码点编码为 UTF-8 时所需字节数
 */
export function measureSize(
    codePoint: number,
    fatal: boolean,
    errOffset: number,
): 0 | 1 | 2 | 3 | 4 {
    if (codePoint <= 0x7f) {
        return 1;
    } else if (codePoint <= 0x7ff) {
        return 2;
    } else if (isSurrogate(codePoint)) {
        if (fatal) {
            throwInvalidSurrogate(codePoint, errOffset);
        } else {
            return 0;
        }
    } else if (codePoint <= 0xffff) {
        return 3;
    } else {
        return 4;
    }
}

/**
 * 精确测量 UTF-8 起始字节对应 Unicode 码点的完整字节序列长度
 */
export function measureLength(
    byte: number,
    fatal: boolean,
    errOffset: number,
): 0 | 1 | 2 | 3 | 4 {
    if ((byte & 0x80) === 0) {
        return 1;
    } else if ((byte & 0xe0) === 0xc0) {
        return 2;
    } else if ((byte & 0xf0) === 0xe0) {
        return 3;
    } else if ((byte & 0xf8) === 0xf0) {
        return 4;
    } else {
        if (fatal) {
            throwInvalidSurrogate(byte, errOffset);
        } else {
            return 0;
        }
    }
}

/**
 * 将单个 Unicode 码点编码为 UTF-8 字节序列
 */
export function encode(
    codePoint: number,
    size: 0 | 1 | 2 | 3 | 4,
    out: { buffer: Uint8Array; offset: number },
): void {
    const buffer = out.buffer;
    let offset = out.offset;

    switch (size) {
        case 0: {
            const [urc1, urc2, urc3] = unicodeReplacementCharBytes;
            buffer[offset++] = urc1;
            buffer[offset++] = urc2;
            buffer[offset++] = urc3;
            break;
        }

        case 1:
            buffer[offset++] = codePoint;
            break;

        case 2:
            buffer[offset++] = 0xc0 | (codePoint >> 6);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
            break;

        case 3:
            buffer[offset++] = 0xe0 | (codePoint >> 12);
            buffer[offset++] = 0x80 | ((codePoint >> 6) & 0x3f);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
            break;

        case 4:
            buffer[offset++] = 0xf0 | (codePoint >> 18);
            buffer[offset++] = 0x80 | ((codePoint >> 12) & 0x3f);
            buffer[offset++] = 0x80 | ((codePoint >> 6) & 0x3f);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
            break;
    }

    out.offset = offset;
}

/**
 * 解码 UTF-8 字节序列中的 Unicode 码点
 *
 * 该函数不处理 `BOM`。
 *
 * @param bytes 字节序列
 * @param firstByte 第一个字节
 * @param len Unicode 码点所对应的字节序列长度，通常由 {@link measureLength} 函数计算得到
 * @param fatal 遇到无效数据时是否直接抛出错误，否则无效字节将使用 {@link fallback} 函数处理。默认为 `false`
 * @param fallback 无效数据处理函数
 * @param out 输出结果
 * @param out.codePoint 解码后得到的 Unicode 码点
 * @param out.offset 调用时传入字节序列的起始偏移量，返回时输出下一个待解码的偏移量
 * @param out.fallbackText 无效数据的替换文本，如果解码成功则为 `undefined`，否则为替换文本
 */
export function decode(
    bytes: Uint8Array,
    firstByte: number,
    len: 0 | 1 | 2 | 3 | 4,
    fatal: boolean,
    fallback: DecodeFallback,
    out: {
        codePoint: number;
        offset: number;
        fallbackText: string | undefined;
    },
): void {
    out.fallbackText = undefined;

    const offset = out.offset;

    const byte = firstByte;

    // Ascii 字符快速路径
    if (len === 1) {
        out.codePoint = byte;
        out.offset += len;
        return;
    }

    // 无效字节长度
    if (len === 0) {
        out.fallbackText = fallback(bytes, offset, true);
        out.offset += 1;
        return;
    }

    // 检查长度是否超出范围
    if (bytes.length - offset < len) {
        if (fatal) {
            throwUnexpectedEnd();
        } else {
            out.fallbackText = fallback(bytes, offset, true);
            // 按照规范建议，仅应跳过当前字节
            out.offset += 1;
        }
        return;
    }

    // 组合字节
    let codePoint = 0;

    for (let i = 1; i < len; i++) {
        const byte = bytes[offset + i];
        // 无效的后续字节
        if ((byte & 0xc0) !== 0x80) {
            if (fatal) {
                throwInvalidSurrogate(byte, offset);
            } else {
                out.fallbackText = fallback(bytes, offset, true);
                // 按照规范建议，仅应跳过当前字节
                out.offset += 1;
            }
            return;
        } else {
            codePoint = (codePoint << 6) | (byte & 0x3f);
        }
    }

    if (len === 2) {
        codePoint = ((byte & 0x1f) << 6) | codePoint;
    } else if (len === 3) {
        codePoint = ((byte & 0x0f) << 12) | codePoint;
    } else {
        codePoint = ((byte & 0x07) << 18) | codePoint;
    }

    // 检查无效情况
    if (isSurrogate(codePoint) || codePoint > 0x10ffff) {
        if (fatal) {
            throwInvalidChar(codePoint, offset);
        } else {
            out.fallbackText = fallback(bytes, offset, true);
            out.offset += len;
        }
        return;
    }

    out.codePoint = byte;
    out.offset += len;
}
