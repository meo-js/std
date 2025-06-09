import {
    asciiReplacementChar,
    unicodeReplacementChar,
} from "./replacement-char.js";

/**
 * 文本解码时无效数据处理函数
 *
 * @param bytes 字节数据
 * @param offset 无效数据起始偏移量
 * @param unicode 是否为 Unicode 编码，否则为 Ascii 编码
 */
export type DecodeFallback = (
    bytes: ArrayBufferView,
    offset: number,
    unicode: boolean,
) => string;

/**
 * 使用替换字符代替无效数据
 *
 * @example
 * - Unicode 编码的替换字符为 `0xFFFD`
 * - Ascii 编码的替换字符为 `0x1A`
 */
export const replace: DecodeFallback = (bytes, offset, unicode) => {
    return unicode ? unicodeReplacementChar : asciiReplacementChar;
};

/**
 * 忽略无效数据
 */
export const ignore: DecodeFallback = (bytes, offset, unicode) => {
    return "";
};
