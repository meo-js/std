/**
 * @public
 *
 * @module
 */
import { Pipe, type IPipe, type Next } from "../pipe.js";
import { isFunction } from "../predicate.js";

class ToUint8Array implements IPipe<number, Uint8Array, Uint8Array> {
    private result: number[] = [];

    transform(input: number, next: Next<Uint8Array>): void {
        this.result.push(input);
    }

    flush(next: Next<Uint8Array>): Uint8Array {
        const result = new Uint8Array(this.result);
        this.result = [];
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.result = [];
    }
}

class ToUint8ArrayWithOut implements IPipe<number, Uint8Array, Uint8Array> {
    private index = 0;

    constructor(private out: Uint8Array) {}

    transform(input: number, next: Next<Uint8Array>): void {
        this.out[this.index++] = input;
    }

    flush(next: Next<Uint8Array>): Uint8Array {
        const out = this.out;
        this.index = 0;
        next(out);
        return out;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class ToUint8ArrayWithCallback
    implements IPipe<number, Uint8Array, Uint8Array>
{
    private out!: Uint8Array;
    private index = 0;

    constructor(private initialize: () => Uint8Array) {
        this.reset();
    }

    transform(input: number, next: Next<Uint8Array>): void {
        this.out[this.index++] = input;
    }

    flush(next: Next<Uint8Array>): Uint8Array {
        const result = this.out;
        this.reset();
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.out = this.initialize();
    }
}

/**
 * 创建将数字转换为 {@link Uint8Array} 的管道
 */
export function toUint8Array(
    out?: Uint8Array | (() => Uint8Array),
): Pipe<number, Uint8Array, Uint8Array> {
    if (out instanceof Uint8Array) {
        return new Pipe(new ToUint8ArrayWithOut(out));
    } else if (isFunction(out)) {
        return new Pipe(new ToUint8ArrayWithCallback(out));
    } else {
        return new Pipe(new ToUint8Array());
    }
}
