/**
 * @module
 *
 * @moduleTag subtle
 */
import type { DecodeFallback } from "../decode-fallback.js";
import * as subtle from "./single-byte.js";
export const MAX_CODE = 255;

/**
 * 解码 Latin1 为字符
 */
export function decode(
    bytes: Uint8Array,
    byte: number,
    fatal: boolean,
    fallback: DecodeFallback,
    errOffset: number,
): string {
    return subtle.decode(MAX_CODE, bytes, byte, fatal, fallback, errOffset);
}

/**
 * 编码字符为 Latin1 字节
 */
export function encode(
    codePoint: number,
    fatal: boolean,
    errOffset: number,
): number {
    return subtle.encode(MAX_CODE, codePoint, fatal, errOffset);
}
