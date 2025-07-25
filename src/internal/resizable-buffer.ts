/**
 * @module
 *
 * @internal
 */
import { HAS_ARRAYBUFFER_TRANSFER } from "../env.js";
import { Pipe, type IPipe, type Next } from "../pipe.js";
import { isArrayBuffer } from "../predicate.js";
import { asUint8Array } from "../typed-array.js";

// NOTE: 后续如果要公开抽象，可能应该是一个基于 ArrayBuffer 的 Array 类？
export class ResizableBuffer {
    get buffer(): Uint8Array {
        return this._buffer;
    }

    get length(): number {
        return this._position;
    }

    private _buffer: Uint8Array;
    private _position: number = 0;

    constructor(initialSize: number) {
        this._buffer = new Uint8Array(initialSize);
    }

    push(value: number): void {
        this._buffer[this._position++] = value;
    }

    at(index: number): number {
        return this._buffer[index];
    }

    set(index: number, value: number): void {
        this._buffer[index] = value;
    }

    expand() {
        const buffer = this._buffer;
        let newLength = buffer.length;

        if (newLength <= 32) {
            newLength = 96;
        } else if (newLength <= 1024) {
            newLength *= 2;
        } else {
            newLength *= 1.5;
        }

        if (HAS_ARRAYBUFFER_TRANSFER) {
            const src = isArrayBuffer(buffer)
                ? buffer
                : (buffer.buffer as ArrayBuffer);
            this._buffer = new Uint8Array(src.transfer(newLength));
        } else {
            const src = asUint8Array(buffer);
            const out = new Uint8Array(newLength);
            out.set(src);
            this._buffer = out;
        }
    }

    expandIfNeeded(increment: number): boolean {
        if (this._position + increment > this._buffer.length) {
            this.expand();
            return true;
        } else {
            return false;
        }
    }

    toUint8Array(): Uint8Array {
        return this._buffer.subarray(0, this._position);
    }
}

export class ResizableBufferPipe implements IPipe<number, ResizableBuffer> {
    private _buffer: ResizableBuffer;

    constructor(private initialSize: number) {
        this._buffer = new ResizableBuffer(initialSize);
    }

    transform(input: number, next: Next<ResizableBuffer>): void {
        this._buffer.expandIfNeeded(1);
        this._buffer.push(input);
    }

    flush(next: Next<ResizableBuffer>): ResizableBuffer {
        const buffer = this._buffer;
        this._buffer = new ResizableBuffer(this.initialSize);
        next(buffer);
        return buffer;
    }

    catch(error: unknown): void {
        this._buffer = new ResizableBuffer(this.initialSize);
    }
}

export function toResizableBuffer(initialSize: number) {
    return Pipe.create(new ResizableBufferPipe(initialSize));
}
