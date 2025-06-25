import type { Endian } from "../../typed-array.js";
import type { decodeFallback } from "../text.js";
import type { DecodeFallback } from "./decode-fallback.js";

/**
 * 文本编码多字节选项
 */
export interface MultibyteOptions {
    /**
     * 指定多字节编码时的字节序
     *
     * @default 默认使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
     */
    endian?: Endian;
}

/**
 * UTF 文本编码选项
 */
export interface UtfOptions {
    /**
     * 是否添加 BOM
     *
     * @default 若编码规范要求则默认添加 BOM，否则不添加
     */
    bom?: boolean;
}

/**
 * 文本编码无效数据处理选项
 */
export interface EncodeFatalOptions {
    /**
     * 遇到无效数据时是否直接抛出错误，否则将使用替换字符（Unicode 为 `0xFFFD`，其它为 `0x1A`）替代
     *
     * @default false
     */
    fatal?: boolean;
}

/**
 * 文本解码无效数据处理选项
 */
export interface DecodeFatalOptions {
    /**
     * 无效数据处理函数
     *
     * @default {@link decodeFallback.replace}
     */
    fallback?: DecodeFallback;

    /**
     * 遇到无效数据时是否直接抛出错误，否则无效字节将使用 {@link fallback} 函数处理。
     *
     * @default false
     */
    fatal?: boolean;
}

/**
 * 文本编码选项
 */
export type EncodeOptions = MultibyteOptions & UtfOptions & EncodeFatalOptions;

/**
 * 文本解码选项
 */
export type DecodeOptions = MultibyteOptions & UtfOptions & DecodeFatalOptions;

/**
 * 文本字节数据验证选项
 */
export type VerifyOptions = MultibyteOptions & IsWellFormedOptions;

/**
 * 字符串验证选项
 */
export type IsWellFormedOptions = {
    /**
     * 是否允许存在替换字符 `U+001A` 或 `U+FFFD`
     *
     * @default false
     */
    allowReplacementChar?: boolean;
};

/**
 * 单字节文本编码选项
 */
export type SingleByteEncodeOptions = EncodeFatalOptions;

/**
 * 单字节文本解码选项
 */
export type SingleByteDecodeOptions = DecodeFatalOptions;

/**
 * UTF-8 编码选项
 */
export type Utf8EncodeOptions = UtfOptions & EncodeFatalOptions;

/**
 * UTF-8 解码选项
 */
export type Utf8DecodeOptions = DecodeFatalOptions;

/**
 * UTF-16 编码选项
 */
export type Utf16EncodeOptions = UtfOptions
    & EncodeFatalOptions
    & MultibyteOptions;

/**
 * UTF-16 解码选项
 */
export type Utf16DecodeOptions = DecodeFatalOptions & MultibyteOptions;
