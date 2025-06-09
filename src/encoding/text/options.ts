import type { OmitKey } from "../../object.js";
import type { Endian } from "../../typed-array.js";
import type { DecodeFallback } from "./decode-fallback.js";

/**
 * 文本编码选项
 */
export interface EncodeOptions {
    /**
     * 指定多字节编码时的字节序
     *
     * @default 默认使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
     */
    endian?: Endian;

    /**
     * 是否添加 BOM
     *
     * @default 若编码规范要求则默认添加 BOM，否则不添加
     */
    bom?: boolean;

    /**
     * 遇到无效数据时是否直接抛出错误，否则将使用替换字符（Unicode 为 `0xFFFD`，其它为 `0x1A`）替代
     *
     * @default false
     */
    fatal?: boolean;
}

/**
 * 文本解码选项
 */
export interface DecodeOptions {
    /**
     * 指定多字节解码未检测到 BOM 时使用的字节序
     *
     * @default 默认使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
     */
    endian?: Endian;

    /**
     * 无效数据处理函数
     *
     * @default {@link textDecodeFallback.replace}
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
 * 单字节文本编码选项
 */
export type SingleByteEncodeOptions = OmitKey<EncodeOptions, "endian" | "bom">;

/**
 * 单字节文本解码选项
 */
export type SingleByteDecodeOptions = OmitKey<DecodeOptions, "endian">;

/**
 * UTF-8 编码选项
 */
export type Utf8EncodeOptions = OmitKey<EncodeOptions, "endian">;
