import type { Utf8EncodeOptions } from "../text/options.js";
import { Encoding } from "./enum.js";

/**
 * 字节数据编码无效数据处理选项
 */
export interface FatalOptions {
    /**
     * 遇到无效数据时是否直接抛出错误，否则将尽可能快地返回数据，无论是否有效或截断。
     *
     * @default true
     *
     * @example {@link Encoding.Hex}
     * `fatal` 为 `false` 时会跳过无效字符。
     * @example {@link Encoding.Base64}
     * `fatal` 为 `false` 时会跳过无效字符。
     */
    fatal?: boolean;
}

/**
 * 字节数据编码 `string` 输入选项
 */
export interface StringOptions {
    /**
     * 文本 UTF-8 编码选项
     */
    utf8Options?: Utf8EncodeOptions;
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
 * Base64 验证选项
 */
export interface Base64VerifyOptions {
    /**
     * 是否允许变体
     *
     * @default true
     */
    allowVariant?: boolean;

    /**
     * 填充符选项
     *
     * @default undefined 表示不检查，true 则强制必要的填充符，false 则强制禁止填充符
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
export type Base64EncodeOptions = StringOptions & Base64Options;

/**
 * Base64 解码选项
 */
export type Base64DecodeOptions = FatalOptions;

/**
 * 字节数据验证选项
 */
export type VerifyOptions = Base64VerifyOptions;

/**
 * Hex 编码选项
 */
export type HexEncodeOptions = StringOptions & HexOptions;

/**
 * Hex 解码选项
 */
export type HexDecodeOptions = FatalOptions;

/**
 * 字节数据编码选项
 */
export type EncodeOptions = StringOptions & Base64Options & HexOptions;

/**
 * 字节数据解码选项
 */
export type DecodeOptions = FatalOptions;
