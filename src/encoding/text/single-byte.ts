/**
 * @module
 *
 * @internal
 */

import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { flat } from "../../pipe/common.js";
import { concatString, flatToCodePoint } from "../../pipe/string.js";
import { toUint8Array } from "../../pipe/typed-array.js";
import {
    ASCII_REPLACEMENT_CODE_POINT,
    isAsciiReplacementCodePoint,
} from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import { catchError, throwInvalidChar } from "../error.js";
import * as decodeFallback from "./decode-fallback.js";
import type {
    SingleByteDecodeOptions,
    SingleByteEncodeOptions,
} from "./options.js";

class DecodePipe implements IPipe<number, string> {
    private fatal: boolean;
    private fallback: decodeFallback.DecodeFallback;

    constructor(
        private maxCode: number,
        opts?: SingleByteDecodeOptions,
    ) {
        this.fatal = opts?.fatal ?? false;
        this.fallback = opts?.fallback ?? decodeFallback.replace;
    }

    transform(byte: number, next: Next<string>): boolean {
        if (byte > this.maxCode) {
            if (this.fatal) {
                throwInvalidChar(byte);
            } else {
                return next(this.fallback(byte, false));
            }
        } else {
            return next(String.fromCharCode(byte));
        }
    }
}

class EncodePipe implements IPipe<number, number> {
    private fatal: boolean;

    constructor(
        private maxCode: number,
        opts?: SingleByteEncodeOptions,
    ) {
        this.fatal = opts?.fatal ?? false;
    }

    transform(codePoint: number, next: Next<number>): boolean {
        if (codePoint > this.maxCode) {
            if (this.fatal) {
                throwInvalidChar(codePoint);
            } else {
                return next(ASCII_REPLACEMENT_CODE_POINT);
            }
        } else {
            return next(codePoint);
        }
    }
}

class VerifyPipe implements IPipe<number, boolean, boolean> {
    private result: boolean = true;

    constructor(
        private maxCode: number,
        private allowReplacementChar: boolean = false,
    ) {}

    transform(byte: number, next: Next<boolean>): boolean {
        if (
            byte > this.maxCode
            || (!this.allowReplacementChar && isAsciiReplacementCodePoint(byte))
        ) {
            this.result = false;
            next(false);
            return false;
        } else {
            return true;
        }
    }

    flush(next: Next<boolean>): boolean {
        const result = this.result;
        this.result = true;

        if (!result) {
            return false;
        }

        next(true);
        return result;
    }

    catch(error: unknown): void {
        this.result = true;
    }
}

export function _decodePipe(maxCode: number, opts?: SingleByteDecodeOptions) {
    return new Pipe(new DecodePipe(maxCode, opts));
}

export function _encodePipe(
    maxCode: number,
    opts?: SingleByteEncodeOptions,
): Pipe<number, number> {
    return new Pipe(new EncodePipe(maxCode, opts));
}

export function _verifyPipe(maxCode: number, allowReplacementChar?: boolean) {
    return new Pipe(new VerifyPipe(maxCode, allowReplacementChar));
}

export function _isWellFormedPipe(
    maxCode: number,
    allowReplacementChar?: boolean,
) {
    // 与 verify 的验证逻辑通用，所以直接返回 VerifyPipe
    return new Pipe(new VerifyPipe(maxCode, allowReplacementChar));
}

export function _decode(
    maxCode: number,
    bytes: BufferSource,
    opts?: SingleByteDecodeOptions,
): string {
    const buffer = asUint8Array(bytes);
    return Pipe.run(
        buffer,
        flat(),
        catchError(),
        _decodePipe(maxCode, opts),
        concatString(new Array(buffer.length)),
    );
}

export function _encode(
    maxCode: number,
    text: string,
    opts?: SingleByteEncodeOptions,
): Uint8Array {
    return Pipe.run(
        text,
        flatToCodePoint(),
        catchError(),
        _encodePipe(maxCode, opts),
        toUint8Array(new Uint8Array(text.length)),
    );
}

export function _verify(
    maxCode: number,
    bytes: BufferSource,
    allowReplacementChar?: boolean,
): boolean {
    const buffer = asUint8Array(bytes);
    return Pipe.run(buffer, flat(), _verifyPipe(maxCode, allowReplacementChar));
}

export function _isWellFormed(
    maxCode: number,
    text: string,
    allowReplacementChar?: boolean,
): boolean {
    return Pipe.run(
        text,
        flatToCodePoint(),
        _verifyPipe(maxCode, allowReplacementChar),
    );
}
