import type { Endian } from "../../utils/typed-array.js";
import type { TextEncoding } from "../text.js";
import { ByteEncoding } from "./enum.js";

/**
 * 字节数据编码 传入 `string` 时的选项
 *
 * @see {@link ByteEncoding}
 */
export interface ByteEncodeStringOptions {
    /**
     * `string` 文本编码
     *
     * 当输入是 `string` 类型时，可以先将其用指定文本编码格式进行编码后再处理。
     *
     * 若不指定则将 `string` 看作 {@link ByteEncoding.Unit8} 编码内容进行处理。
     *
     * @default undefined
     */
    encoding?: TextEncoding;
}

/**
 * 字节数据编码选项
 */
export interface ByteEncodeOptions extends ByteEncodeStringOptions {
    /**
     * 是否美化输出
     *
     * @example {@link ByteEncoding.Hex}
     *
     * `48656c6c6f` -> `6F 6C 6C 6F`
     */
    pretty?: boolean;

    /**
     * 指定多字节编码时的字节序
     *
     * @default 默认使用平台字节序
     */
    endian?: Endian;

    /**
     * Base64 编码选项
     */
    base64?: Omit<Base64EncodeOptions, keyof ByteEncodeStringOptions>;
}

/**
 * 字节数据解码选项
 */
export interface ByteDecodeOptions {
    /**
     * 指定多字节解码时的字节序
     *
     * @default 默认使用平台字节序
     */
    endian?: Endian;
}

/**
 * Base64 编码选项
 */
export interface Base64EncodeOptions extends ByteEncodeStringOptions {
    /**
     * 是否添加填充符
     *
     * @default true
     */
    padding?: boolean;
}

/**
 * Uint8 编码选项
 */
export type Uint8EncodeOptions = Omit<
    ByteEncodeOptions,
    "pretty" | "endian" | "base64"
>;

/**
 * Uint16 编码选项
 */
export type Uint16EncodeOptions = Omit<ByteEncodeOptions, "pretty" | "base64">;

/**
 * Hex 编码选项
 */
export type HexEncodeOptions = Omit<ByteEncodeOptions, "endian" | "base64">;
