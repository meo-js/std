/**
 * @module
 *
 * @internal
 */

import { caught } from "../pipe/common.js";
import { isString } from "../predicate.js";

export function throwInvalidChar(char: number | string): never {
    if (isString(char)) {
        throw new RangeError(`invalid character '${char}'.`);
    } else {
        throw new RangeError(
            `invalid character '${String.fromCharCode(char)}'(0x${char.toString(16)}).`,
        );
    }
}

export function throwInvalidSurrogate(code: number): never {
    throw new RangeError(`invalid surrogate pair (0x${code.toString(16)}).`);
}

export function throwInvalidByte(byte: number): never {
    throw new RangeError(`invalid byte (0x${byte.toString(16)}).`);
}

export function throwInvalidLength(
    got: number,
    expected: number,
    char: boolean,
) {
    const message = `invalid length: got ${got} ${char ? "characters" : "bytes"}, expected at least ${expected}.`;
    throw new Error(message);
}

export function throwUnsupportedEncoding(encoding: string): never {
    throw new TypeError(`unsupported encoding: ${encoding}.`);
}

export function wrapError(error: unknown, index: number) {
    return new RangeError(`an error occurred at position ${index}.`, {
        cause: error,
    });
}

export function catchError<In>() {
    return caught<In>((error, index) => {
        return wrapError(error, index);
    });
}
