import { ResizableBuffer } from "../../internal/resizable-buffer.js";
import { hasReplacementChar, needsSurrogatePair } from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import * as decodeFallback from "./decode-fallback.js";
import type { SingleByteDecodeOptions, Utf8EncodeOptions } from "./options.js";
import { unicodeReplacementCharBytes } from "./replacement-char.js";
import * as subtle from "./subtle/utf8.js";
import { BOM } from "./subtle/utf8.js";

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
    const data = asUint8Array(bytes);
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;

    let str = "";

    const temp = {
        codePoint: 0,
        offset: hasBom(data) ? 3 : 0,
        fallbackText: undefined as string | undefined,
    };

    while (temp.offset < data.length) {
        const offset = temp.offset;
        const byte = data[offset];
        const _len = subtle.measureLength(byte, fatal, offset);
        subtle.decode(data, byte, _len, fatal, fallback, temp);

        if (temp.fallbackText == null) {
            str += String.fromCodePoint(temp.codePoint);
        } else {
            str += temp.fallbackText;
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

    const buffer = new ResizableBuffer(addBom ? text.length + 3 : text.length);

    const temp = {
        buffer: buffer.buffer,
        offset: 0,
    };

    if (addBom) {
        buffer.push(BOM[0]);
        buffer.push(BOM[1]);
        buffer.push(BOM[2]);
        temp.offset += 3;
    }

    const len = text.length;
    let i = 0;

    while (i < len) {
        const code = text.codePointAt(i)!;
        let _size = subtle.measureSize(code, fatal, i);

        if (_size === 0) {
            _size = unicodeReplacementCharBytes.length as 3;
        }

        if (buffer.expandIfNeeded(_size)) {
            temp.buffer = buffer.buffer;
        }

        subtle.encode(code, _size, temp);

        i += needsSurrogatePair(code) ? 2 : 1;
    }

    return buffer.toUint8Array();
}

/**
 * 检查字节序列开头是否包含 UTF-8 BOM
 *
 * @param bytes 输入的字节序列
 * @returns 如果包含 BOM 返回 `true`，否则返回 `false`
 */
export function hasBom(bytes: Uint8Array): boolean {
    return (
        bytes.length >= 3
        && bytes[0] === BOM[0]
        && bytes[1] === BOM[1]
        && bytes[2] === BOM[2]
    );
}

/**
 * 验证是否为有效的 UTF-8 字节数据
 *
 * @param bytes 字节数据
 * @returns 是否为有效的 UTF-8 编码
 */
export function verify(bytes: BufferSource): boolean {
    const data = asUint8Array(bytes);

    const temp = {
        codePoint: 0,
        offset: hasBom(data) ? 3 : 0,
        fallbackText: undefined as string | undefined,
    };

    while (temp.offset < data.length) {
        const offset = temp.offset;
        const byte = data[offset];
        const _len = subtle.measureLength(byte, false, offset);
        subtle.decode(data, byte, _len, false, decodeFallback.replace, temp);

        if (temp.fallbackText != null) {
            return false;
        }
    }

    return true;
}

/**
 * 判断字符串是否可被编码为完全有效的 UTF-8 字节数据
 *
 * 等同于调用 {@link String.isWellFormed} 和 {@link hasReplacementChar} 方法。
 */
export function isWellFormed(text: string): boolean {
    return text.isWellFormed() && !hasReplacementChar(text);
}

/**
 * 估算字符串编码为 UTF-8 时可能的最大字节数
 */
export function estimateSize(text: string, bom: boolean = false): number {
    return text.length * 3 + (bom ? 3 : 0);
}

/**
 * 精确测量字符串编码为 UTF-8 时所需字节数
 */
export function measureSize(text: string, opts?: Utf8EncodeOptions): number {
    const addBom = opts?.bom ?? false;
    const fatal = opts?.fatal ?? false;

    const len = text.length;
    let size = addBom ? 3 : 0;
    let i = 0;

    while (i < len) {
        const code = text.codePointAt(i)!;
        const _size = subtle.measureSize(code, fatal, i);

        if (_size === 0) {
            size += unicodeReplacementCharBytes.length;
        } else {
            size += _size;
        }

        i += needsSurrogatePair(code) ? 2 : 1;
    }

    return size;
}

/**
 * 精确测量 UTF-8 字节数据解码为字符串后的长度
 */
export function measureLength(
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): number {
    const data = asUint8Array(bytes);
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;

    let length = 0;

    const temp = {
        codePoint: 0,
        offset: hasBom(data) ? 3 : 0,
        fallbackText: undefined as string | undefined,
    };

    while (temp.offset < data.length) {
        const offset = temp.offset;
        const byte = data[offset];
        const _len = subtle.measureLength(byte, fatal, offset);
        subtle.decode(data, byte, _len, fatal, fallback, temp);

        if (temp.fallbackText != null) {
            length += temp.fallbackText.length;
        } else {
            length += needsSurrogatePair(temp.codePoint) ? 2 : 1;
        }
    }

    return length;
}

export {
    /**
     * UTF-8 底层 API
     */
    subtle,
};
