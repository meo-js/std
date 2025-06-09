/**
 * @module
 *
 * @internal
 */

import { hasReplacementChar } from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import * as decodeFallback from "./decode-fallback.js";
import type {
    SingleByteDecodeOptions,
    SingleByteEncodeOptions,
} from "./options.js";
import * as subtle from "./subtle/single-byte.js";

export function _decode(
    maxCode: number,
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): string {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;
    const data = asUint8Array(bytes);

    if (bytes.byteLength === 0) {
        return "";
    }

    let str = "";
    let i = 0;

    for (const code of data) {
        str += subtle.decode(maxCode, data, code, fatal, fallback, i++);
    }

    return str;
}

export function _encode(
    maxCode: number,
    text: string,
    opts?: SingleByteEncodeOptions,
): Uint8Array {
    const fatal = opts?.fatal ?? false;

    const buffer = new Uint8Array(text.length);

    for (let i = 0; i < text.length; i++) {
        buffer[i] = subtle.encode(maxCode, text.charCodeAt(i), fatal, i);
    }

    return buffer;
}

export function _verify(maxCode: number, bytes: BufferSource): boolean {
    const data = asUint8Array(bytes);

    for (const byte of data) {
        if (byte > maxCode) {
            return false;
        }
    }

    return true;
}

export function _isWellFormed(maxCode: number, text: string): boolean {
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code > maxCode) {
            return false;
        }
    }

    return !hasReplacementChar(text);
}
