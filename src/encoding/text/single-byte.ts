/**
 * @module
 *
 * @internal
 */

import { Endian, asUint8Array } from "../../utils/typed-array.js";
import * as decodeFallback from "./decode-fallback.js";
import * as encodeFallback from "./encode-fallback.js";
import { TextEncoding } from "./enum.js";
import type {
    TextDecodeSingleByteOptions,
    TextEncodeSingleByteOptions,
} from "./options.js";
import { replacementCharRegex } from "./replacement-char.js";

export function _decode(
    maxCode: number,
    encoding: TextEncoding,
    bytes: BufferSource,
    opts?: TextDecodeSingleByteOptions,
): string {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? decodeFallback.replace;

    if (bytes.byteLength === 0) {
        return "";
    }

    const data = asUint8Array(bytes);
    const chars = new Array<string>(data.length);

    let i = 0;
    for (const code of data) {
        if (code > maxCode) {
            if (fatal) {
                throwInvalidCharError(i, code);
            } else {
                chars[i] = fallback(data, i, Endian.Little, encoding);
            }
        } else {
            chars[i] = String.fromCharCode(code);
        }
        i++;
    }

    return chars.join("");
}

export function _encode(
    maxCode: number,
    encoding: TextEncoding,
    text: string,
    opts?: TextEncodeSingleByteOptions,
): Uint8Array {
    const fatal = opts?.fatal ?? false;
    const fallback = opts?.fallback ?? encodeFallback.replace;

    const buffer = new Uint8Array(text.length);

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code > maxCode) {
            if (fatal) {
                throwInvalidCharError(i, code);
            } else {
                buffer[i] = fallback(text, i, Endian.Little, encoding);
            }
        } else {
            buffer[i] = code;
        }
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

export function _isWellFormed(
    maxCode: number,
    text: string,
    allowReplacementChar: boolean = true,
): boolean {
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code > maxCode) {
            return false;
        }
    }

    return allowReplacementChar ? true : !replacementCharRegex.test(text);
}

function throwInvalidCharError(i: number, code: number): never {
    throw new RangeError(
        `invalid character at position ${i}: ${String.fromCharCode(code)}(0x${code.toString(16)})`,
    );
}
