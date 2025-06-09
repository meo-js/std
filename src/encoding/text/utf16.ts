import { PLATFORM_ENDIAN } from "../../env.js";
import {
    hasReplacementChar,
    isHighSurrogate,
    isLowSurrogate,
    needsSurrogatePair,
} from "../../string.js";
import { Endian, asDataView, asUint8Array } from "../../typed-array.js";
import { throwInvalidLength } from "../error.js";
import * as decodeFallback from "./decode-fallback.js";
import type { DecodeOptions, EncodeOptions } from "./options.js";
import * as subtle from "./subtle/utf16.js";
import { BOM, BOM_REVERSE } from "./subtle/utf16.js";

/**
 * 以 UTF-16 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link DecodeOptions}
 * @returns 字符串
 */
export function decode(bytes: BufferSource, opts?: DecodeOptions): string {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;
    const data = asDataView(bytes);
    const byteLength = data.byteLength;
    const hasRedundantByte = byteLength % 2 !== 0;

    if (byteLength === 0) {
        return "";
    }

    if (hasRedundantByte) {
        if (fatal) {
            throwInvalidLength(byteLength, "even");
        } else if (byteLength === 1) {
            return fallback(data, 0, true);
        }
    }

    const endian = sniff(bytes);
    const hasBom = endian != null;
    const little = (endian ?? opts?.endian ?? PLATFORM_ENDIAN) !== Endian.Big;

    const temp = {
        codePoint: 0,
        offset: hasBom ? 2 : 0,
        fallbackText: undefined as string | undefined,
    };

    let str = "";

    while (temp.offset + 2 <= byteLength) {
        const offset = temp.offset;
        const byte = data.getUint16(offset, little);
        const _len = subtle.measureLength(byte, fatal, offset);
        subtle.decode(data, byte, _len, little, fatal, fallback, temp);

        if (temp.fallbackText == null) {
            str += String.fromCodePoint(temp.codePoint);
        } else {
            str += temp.fallbackText;
        }
    }

    // 剩余的无效的单字节数据
    if (temp.offset < byteLength) {
        str += fallback(data, temp.offset, true);
    }

    return str;
}

/**
 * 编码字符串为 UTF-16 字节数据
 *
 * @param text 字符串
 * @param opts {@link EncodeOptions}
 * @returns UTF-16 字节数据
 */
export function encode(text: string, opts?: EncodeOptions): Uint8Array {
    const endian = opts?.endian ?? PLATFORM_ENDIAN;
    const addBom = opts?.bom ?? true;
    const little = endian !== Endian.Big;
    const fatal = opts?.fatal ?? false;

    const len = text.length;
    const data = new DataView(new ArrayBuffer(measureSize(text, addBom)));

    if (addBom) {
        data.setUint16(0, BOM, little);
    }

    const temp = {
        buffer: data,
        offset: addBom ? 2 : 0,
    };

    let i = 0;

    while (i < len) {
        const code = text.codePointAt(i)!;
        const _size = subtle.measureSize(code, fatal, i);
        subtle.encode(code, _size, little, temp);

        i += needsSurrogatePair(code) ? 2 : 1;
    }

    return asUint8Array(data);
}

/**
 * 检测 UTF-16 字节数据的字节序
 *
 * @param bytes 字节数据
 * @returns 字节序，若无法检测则返回 `undefined`
 */
export function sniff(bytes: BufferSource): Endian | undefined {
    const data = asUint8Array(bytes);

    if (data.length < 2) {
        return undefined;
    }

    const bom = (data[0] << 8) | data[1];
    if (bom === BOM) {
        return Endian.Big;
    } else if (bom === BOM_REVERSE) {
        return Endian.Little;
    } else {
        return undefined;
    }
}

/**
 * 验证是否为有效的 UTF-16 字节数据
 *
 * @param bytes 字节数据
 * @param endian 指定字节序，默认会自动检测，若无法检测且未指定则使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
 * @returns 是否为有效的 UTF-16 编码
 */
export function verify(bytes: BufferSource, endian?: Endian): boolean {
    const data = asDataView(bytes);

    // UTF-16 编码的字节长度必须是偶数
    if (data.byteLength % 2 !== 0) {
        return false;
    }

    // 获取字节序
    const _endian = sniff(data);
    const hasBom = _endian != null;

    const len = data.byteLength / 2;
    const little = (_endian ?? endian ?? PLATFORM_ENDIAN) !== Endian.Big;

    for (let i = hasBom ? 1 : 0; i < len; i++) {
        const pos = i * 2;
        const code = data.getUint16(pos, little);

        if (isHighSurrogate(code)) {
            if (i + 1 >= len) {
                return false;
            }

            const lowCode = data.getUint16(pos + 2, little);
            if (!isLowSurrogate(lowCode)) {
                return false;
            }

            // 跳过已验证的低代理项
            i++;
        } else if (isLowSurrogate(code)) {
            return false;
        }
    }

    return true;
}

/**
 * 判断字符串是否可被编码为完全有效的 UTF-16 字节数据
 *
 * 等同于调用 {@link String.isWellFormed} 和 {@link hasReplacementChar} 方法。
 */
export function isWellFormed(text: string): boolean {
    return text.isWellFormed() && !hasReplacementChar(text);
}

/**
 * 精确测量字符串编码为 UTF-16 时可能的最大字节数
 */
export function measureSize(text: string, bom: boolean = false): number {
    return text.length * 2 + (bom ? 2 : 0);
}

/**
 * 精确测量 UTF-16 字节数据解码为字符串后的长度
 */
export function measureLength(
    bytes: BufferSource,
    opts?: DecodeOptions,
): number {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;
    const data = asDataView(bytes);
    const byteLength = data.byteLength;
    const hasRedundantByte = byteLength % 2 !== 0;

    if (byteLength === 0) {
        return 0;
    }

    if (hasRedundantByte) {
        if (fatal) {
            throwInvalidLength(byteLength, "even");
        } else if (byteLength === 1) {
            return fallback(data, 0, true).length;
        }
    }

    const endian = sniff(bytes);
    const hasBom = endian != null;
    const little = (endian ?? opts?.endian ?? PLATFORM_ENDIAN) !== Endian.Big;

    const temp = {
        codePoint: 0,
        offset: hasBom ? 2 : 0,
        fallbackText: undefined as string | undefined,
    };

    let len = 0;

    while (temp.offset + 2 <= byteLength) {
        const offset = temp.offset;
        const byte = data.getUint16(offset, little);
        const _len = subtle.measureLength(byte, fatal, offset);
        subtle.decode(data, byte, _len, little, fatal, fallback, temp);

        if (temp.fallbackText == null) {
            len += 1;
        } else {
            len += temp.fallbackText.length;
        }
    }

    // 剩余的无效的单字节数据
    if (temp.offset < byteLength) {
        len += fallback(data, temp.offset, true).length;
    }

    return len;
}

export {
    /**
     * UTF-16 底层 API
     */
    subtle,
};
