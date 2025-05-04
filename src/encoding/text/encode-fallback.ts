import type { CodecableEndian } from "../shared.js";
import { Encoding } from "./enum.js";
import { unicodeReplacementCharCode } from "./replacement-char.js";

/**
 * 文本编码时无效数据处理函数
 *
 * @param str 字符串
 * @param offset 无效字符起始偏移量
 * @param endian 字节序
 * @param encoding 编码格式
 */
export type EncodeFallback = (
    str: string,
    offset: number,
    endian: CodecableEndian,
    encoding: Encoding,
) => number;

/**
 * 使用替换字符代替无效数据
 *
 * @example
 * - Unicode 编码的替换字符为 `0xFFFD`
 * - Ascii 编码的替换字符为 `0x1A`
 */
export const replace: EncodeFallback = (str, offset, endian, encoding) => {
    switch (encoding) {
        default:
            return unicodeReplacementCharCode;
    }
};
