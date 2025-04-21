import type { CodecableEndian } from "../shared.js";
import { TextEncoding } from "./enum.js";
import { unicodeReplacementChar } from "./replacement-char.js";

/**
 * 文本解码时无效数据处理函数
 *
 * @param data 字节数据
 * @param offset 无效数据起始偏移量
 * @param endian 字节序
 * @param encoding 编码格式
 */
export type TextDecodeFallback = (
    data: ArrayBufferView,
    offset: number,
    endian: CodecableEndian,
    encoding: TextEncoding,
) => string;

/**
 * 使用替换字符代替无效数据
 *
 * @example
 * - Unicode 编码的替换字符为 `0xFFFD`
 * - Ascii 编码的替换字符为 `0x1A`
 */
export const replace: TextDecodeFallback = (data, offset, endian, encoding) => {
    switch (encoding) {
        default:
            return unicodeReplacementChar;
    }
};

/**
 * 忽略无效数据
 */
export const ignore: TextDecodeFallback = (data, offset, endian, encoding) => {
    switch (encoding) {
        default:
            return "";
    }
};
