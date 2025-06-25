import {
    ASCII_REPLACEMENT_CHAR,
    UNICODE_REPLACEMENT_CHAR,
} from "../../string.js";

/**
 * 文本解码时无效数据处理函数
 *
 * @param codeUnit 编码单元值
 * @param unicode 是否为 Unicode 编码，否则为 Ascii 编码
 */
export type DecodeFallback = (codeUnit: number, unicode: boolean) => string;

/**
 * 使用替换字符代替无效数据
 *
 * @example
 * - Unicode 编码的替换字符为 `0xFFFD`
 * - Ascii 编码的替换字符为 `0x1A`
 */
export const replace: DecodeFallback = (codeUnit, unicode) => {
    return unicode ? UNICODE_REPLACEMENT_CHAR : ASCII_REPLACEMENT_CHAR;
};

/**
 * 忽略无效数据
 */
export const ignore: DecodeFallback = (codeUnit, unicode) => {
    return "";
};
