/**
 * @module
 *
 * @moduleTag subtle
 */
import {
    isHighSurrogate,
    isLowSurrogate,
    isSurrogate,
    needsSurrogatePair,
    toCodePoint,
    toHighSurrogate,
    toLowSurrogate,
} from "../../../string.js";
import { throwInvalidSurrogate, throwUnexpectedEnd } from "../../error.js";
import type { DecodeFallback } from "../decode-fallback.js";
import { unicodeReplacementCharCode } from "../replacement-char.js";

/**
 * 大端序 UTF-16 BOM
 */
export const BOM = 0xfeff;

/**
 * 小端序 UTF-16 BOM
 */
export const BOM_REVERSE = 0xfffe;

/**
 * 精确测量 Unicode 码点编码为 UTF-16 时所需字节数
 */
export function measureSize(
    codePoint: number,
    fatal: boolean,
    errOffset: number,
): 0 | 1 | 2 {
    if (isSurrogate(codePoint)) {
        if (fatal) {
            throwInvalidSurrogate(codePoint, errOffset);
        } else {
            return 0;
        }
    } else if (needsSurrogatePair(codePoint)) {
        return 2;
    } else {
        return 1;
    }
}

/**
 * 精确测量 UTF-16 起始编码单元对应 Unicode 码点的完整字节序列长度
 */
export function measureLength(
    byte: number,
    fatal: boolean,
    errOffset: number,
): 0 | 1 | 2 {
    if (isHighSurrogate(byte)) {
        return 2;
    } else if (isLowSurrogate(byte)) {
        if (fatal) {
            throwInvalidSurrogate(byte, errOffset);
        } else {
            return 0;
        }
    } else {
        return 1;
    }
}

/**
 * 将单个 Unicode 码点编码为 UTF-16 字节序列
 */
export function encode(
    codePoint: number,
    size: 0 | 1 | 2,
    little: boolean,
    out: { buffer: DataView; offset: number },
) {
    const buffer = out.buffer;
    const offset = out.offset;

    switch (size) {
        case 0: {
            buffer.setUint16(offset, unicodeReplacementCharCode, little);
            out.offset += 2;
            break;
        }

        case 1:
            buffer.setUint16(offset, codePoint, little);
            out.offset += 2;
            break;

        case 2:
            buffer.setUint16(offset, toHighSurrogate(codePoint), little);
            buffer.setUint16(offset + 2, toLowSurrogate(codePoint), little);
            out.offset += 2 * 2;
            break;
    }
}

/**
 * 解码 UTF-16 字节序列中的 Unicode 码点
 *
 * 该函数不处理 `BOM`。
 */
export function decode(
    bytes: DataView,
    firstByte: number,
    len: 0 | 1 | 2,
    little: boolean,
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
    const code = firstByte;

    switch (len) {
        case 0:
            out.fallbackText = fallback(bytes, offset, true);
            out.offset += 2;
            break;

        case 1:
            out.codePoint = code;
            out.offset += 2;
            break;

        case 2: {
            if (offset + 2 <= bytes.byteLength) {
                const lowOffset = offset + 2;
                const lowCode = bytes.getUint16(lowOffset, little);
                if (isLowSurrogate(lowCode)) {
                    out.codePoint = toCodePoint(code, lowCode);
                    // 跳过低代理项
                    out.offset += 2 * 2;
                    return;
                } else {
                    if (fatal) {
                        throwInvalidSurrogate(code, offset);
                    }
                }
            } else {
                if (fatal) {
                    throwUnexpectedEnd();
                }
            }

            // 超出长度或无效的低代理项，且 fatal = false
            out.fallbackText = fallback(bytes, offset, true);
            // 按照规范建议，仅应跳过当前编码单元
            out.offset += 2;
            break;
        }
    }
}
