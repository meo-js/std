/**
 * @module
 *
 * @internal
 */
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { flatToCodePoint } from "../../pipe/string.js";
import {
    isReplacementCodePoint,
    isSurrogate,
    needsSurrogatePair,
} from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import { catchError } from "../error.js";

export class VerifyPipe implements IPipe<number, boolean, boolean> {
    private result: boolean = true;

    constructor(
        private decoder: Pipe<number, string, void>,
        allowReplacementChar: boolean = false,
    ) {
        this.decoder = decoder;
        if (!allowReplacementChar) {
            this.decoder.pipe(value => {
                const codePoint = value.codePointAt(0)!;
                if (isReplacementCodePoint(codePoint)) {
                    throw null;
                }
            });
        }
    }

    transform(byte: number, next: Next<boolean>): boolean {
        try {
            this.decoder.push(byte);
            return true;
        } catch (error) {
            this.result = false;
            next(false);
            return false;
        }
    }

    flush(next: Next<boolean>): boolean {
        const result = this.result;
        this.result = true;

        if (!result) {
            return false;
        }

        try {
            this.decoder.flush();
            next(true);
            return true;
        } catch (error) {
            next(false);
            return false;
        }
    }

    catch(error: unknown): unknown {
        this.result = true;
        return this.decoder.throw(error);
    }
}

export class IsWellFormedPipe implements IPipe<number, boolean, boolean> {
    private result: boolean = true;

    constructor(private allowReplacementChar: boolean = false) {}

    transform(codePoint: number, next: Next<boolean>): boolean {
        if (isSurrogate(codePoint)) {
            this.result = false;
            next(false);
            return false;
        } else {
            if (
                !this.allowReplacementChar
                && isReplacementCodePoint(codePoint)
            ) {
                this.result = false;
                next(false);
                return false;
            } else {
                return true;
            }
        }
    }

    flush(next: Next<boolean>): boolean {
        const result = this.result;
        this.result = true;

        if (!result) {
            return false;
        }

        next(true);
        return true;
    }

    catch(error: unknown): void {
        this.result = true;
    }
}

export function _encodeInto(
    text: string,
    out: BufferSource,
    encodePipe: Pipe<number, number, void>,
    sufficientSize: number,
    tempSize: number,
): { read: number; written: number } {
    const buffer = asUint8Array(out);

    let read = 0;
    let written = 0;

    if (buffer.length >= sufficientSize) {
        read = text.length;
        Pipe.run(text, flatToCodePoint(), catchError(), encodePipe, input => {
            buffer[written++] = input;
        });
    } else {
        const temp = new Uint8Array(tempSize);
        let i = 0;
        const len = text.length;
        const encoder = catchError<number>()
            .pipe(encodePipe)
            .pipe(input => {
                temp[i++] = input;
            });

        while (read < len) {
            const code = text.codePointAt(read)!;
            read += needsSurrogatePair(code) ? 2 : 1;

            encoder.push(code);

            if (buffer.length - written < i) {
                // 剩余空间不足
                break;
            }

            for (let j = 0; j < i; j++) {
                buffer[written++] = temp[j];
            }

            i = 0;
        }
    }

    return {
        read,
        written,
    };
}
