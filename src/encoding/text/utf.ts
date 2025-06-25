/**
 * @module
 *
 * @internal
 */
import type { IPipe, Next, Pipe } from "../../pipe.js";
import { isReplacementCodePoint, isSurrogate } from "../../string.js";

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
