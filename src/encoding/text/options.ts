import type { OmitKey } from "../../object.js";
import type { Endian } from "../../typed-array.js";
import type { CodecableEndian } from "../shared.js";
import type { DecodeFallback } from "./decode-fallback.js";
import type { EncodeFallback } from "./encode-fallback.js";

/**
 * 文本编码选项
 */
export interface EncodeOptions {
    /**
     * 指定多字节编码时的字节序
     *
     * @default 默认使用 {@link Endian.Little} 字节序
     */
    endian?: CodecableEndian;

    /**
     * 是否添加 BOM
     *
     * @default 若编码规范要求则默认添加 BOM，否则不添加
     */
    bom?: boolean;

    /**
     * 无效数据处理函数
     *
     * @default {@link textEncodeFallback.replace}
     */
    fallback?: EncodeFallback;

    /**
     * 遇到无效数据时是否直接抛出错误，否则将使用 {@link fallback} 函数处理。
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
     * @default 默认使用 {@link Endian.Little} 字节序
     */
    endian?: CodecableEndian;

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
