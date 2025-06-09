/**
 * @module
 *
 * @moduleTag subtle
 * @internal
 */

import { throwInvalidChar } from "../../error.js";
import type { DecodeFallback } from "../decode-fallback.js";
import { asciiReplacementCharCode } from "../replacement-char.js";

/**
 * 解码单字节为字符
 */
export function decode(
    maxCode: number,
    bytes: Uint8Array,
    byte: number,
    fatal: boolean,
    fallback: DecodeFallback,
    errOffset: number,
): string {
    if (byte > maxCode) {
        if (fatal) {
            throwInvalidChar(byte, errOffset);
        } else {
            return fallback(bytes, errOffset, false);
        }
    } else {
        return String.fromCharCode(byte);
    }
}

/**
 * 编码字符为单字节
 */
export function encode(
    maxCode: number,
    codePoint: number,
    fatal: boolean,
    errOffset: number,
): number {
    if (codePoint > maxCode) {
        if (fatal) {
            throwInvalidChar(codePoint, errOffset);
        } else {
            return asciiReplacementCharCode;
        }
    } else {
        return codePoint;
    }
}
