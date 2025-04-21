/**
 * @module
 *
 * @internal
 */

import { isString } from "../utils/guard";

export function throwUnexpectedEnd(): never {
    throw new RangeError("unexpected end of data.");
}

export function throwInvalidChar(char: number | string, offset: number): never {
    if (isString(char)) {
        throw new RangeError(
            `invalid character at position ${offset}: ${char}.`,
        );
    } else {
        throw new RangeError(
            `invalid character at position ${offset}: ${String.fromCharCode(char)}(0x${char.toString(16)}).`,
        );
    }
}

export function throwInvalidSurrogate(code: number, offset: number): never {
    throw new RangeError(
        `invalid surrogate pair at position ${offset}: 0x${code.toString(16)}`,
    );
}

export function throwInvalidLength(length: number, expect: "even"): never {
    throw new TypeError(`the byte length is not ${expect}: ${length}.`);
}

export function throwUnsupportedEncoding(encoding: string): never {
    throw new TypeError(`unsupported encoding: ${encoding}.`);
}
