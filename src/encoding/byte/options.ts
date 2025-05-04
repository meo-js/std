import type { CodecableEndian } from "../shared.js";
import type { CodecableEncoding as CodecableTextEncoding } from "../text/enum.js";
import type { EncodeOptions as TextEncodeOptions } from "../text/options.js";
import { Encoding } from "./enum.js";

/**
 * 字节数据编码多字节选项
 */
export interface MultibyteOptions {
    /**
     * 指定多字节编解码时的字节序
     *
     * @default 默认使用平台字节序
     */
    endian?: CodecableEndian;
}

/**
 * 字节数据编码多字节选项
 */
export interface FatalOptions {
    /**
     * 遇到无效数据时是否直接抛出错误，否则将尽可能快地返回数据，无论是否有效或截断。
     *
     * @default true
     *
     * @example {@link Encoding.Unit8}
     * `fatal` 为 `false` 时，不会检查字符代码是否超出 `0xff`。
     * @example {@link Encoding.Unit16}
     * `fatal` 为 `false` 时，数据可能会被截断返回。
     * @example {@link Encoding.Hex}
     * `fatal` 为 `false` 时，数据可能会被截断且带有无效字节 `0x00` 返回。
     * @example {@link Encoding.Base64}
     * `fatal` 为 `false` 时，数据可能会被截断且带有任何无效数据返回。
     */
    fatal?: boolean;
}

/**
 * 字节数据编码 `string` 输入选项
 */
export interface StringOptions {
    /**
     * `string` 文本编码
     *
     * 当输入数据是 `string` 类型时，先用指定编码格式编码为字节数据后再进行处理。
     *
     * 若传入 `undefined` 则将 `string` 的每个代码单元作为单个字节进行处理。
     *
     * @default undefined
     */
    encoding?: CodecableTextEncoding;

    /**
     * 文本编码选项
     *
     * 仅 {@link encoding} 传入非 `undefined` 时有效。
     *
     * @default 请查看 {@link TextEncodeOptions}
     */
    encodingOptions?: TextEncodeOptions;
}

/**
 * 字节数据编码针对 Base64 的编码选项
 */
export interface Base64Options {
    /**
     * 是否添加填充符
     *
     * @default true
     *
     * @example {@link Encoding.Base64}
     *
     * `dGVzdA` -> `dGVzdA==`
     */
    padding?: boolean;
}

/**
 * 字节数据编码针对 Hex 的编码选项
 */
export interface HexOptions {
    /**
     * 是否美化输出
     *
     * @default false
     *
     * @example {@link Encoding.Hex}
     *
     * `48656c6c6f` -> `6F 6C 6C 6F`
     */
    pretty?: boolean;
}

/**
 * Base64 编码选项
 */
export type Base64EncodeOptions = StringOptions & FatalOptions & Base64Options;

/**
 * Base64 解码选项
 */
export type Base64DecodeOptions = FatalOptions;

/**
 * Unit8 编码选项
 */
export type Unit8EncodeOptions = StringOptions & FatalOptions;

/**
 * Unit8 解码选项
 */
export type Unit8DecodeOptions = FatalOptions;

/**
 * Unit16 编码选项
 */
export type Unit16EncodeOptions = StringOptions
    & MultibyteOptions
    & FatalOptions;

/**
 * Unit16 解码选项
 */
export type Unit16DecodeOptions = MultibyteOptions;

/**
 * Hex 编码选项
 */
export type HexEncodeOptions = StringOptions & FatalOptions & HexOptions;

/**
 * Hex 解码选项
 */
export type HexDecodeOptions = FatalOptions;

/**
 * 字节数据编码选项
 */
export type EncodeOptions = StringOptions
    & MultibyteOptions
    & FatalOptions
    & Base64Options
    & HexOptions;

/**
 * 字节数据解码选项
 */
export type DecodeOptions = MultibyteOptions & FatalOptions;
