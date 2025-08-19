/**
 * @public
 * @module
 */
import { Pipe, type IPipe, type Next } from '../pipe.js';
import type { checked } from '../ts.js';

/**
 * 创建将数值收集到 {@link Uint8Array} 的管道
 */
export function toUint8Array<
  TArrayBuffer extends ArrayBufferLike = ArrayBuffer,
>(
  out?: Uint8Array<TArrayBuffer>,
): Pipe<number, Uint8Array<TArrayBuffer>, Uint8Array<TArrayBuffer>> {
  if (out instanceof Uint8Array) {
    return Pipe.create(new ToUint8ArrayWithOut(out));
  } else {
    return Pipe.create(new ToUint8Array()) as checked;
  }
}

/**
 * 创建将数值收集到 {@link Uint8Array} 的管道
 */
export function toUint8ArrayWithCount<
  TArrayBuffer extends ArrayBufferLike = ArrayBuffer,
>(
  out: Uint8Array<TArrayBuffer>,
): Pipe<
  number,
  { buffer: Uint8Array<TArrayBuffer>; written: number },
  { buffer: Uint8Array<TArrayBuffer>; written: number }
> {
  return Pipe.create(new ToUint8ArrayWithCount(out));
}

class ToUint8Array
  implements IPipe<number, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>
{
  private result: number[] = [];

  transform(input: number, next: Next<Uint8Array<ArrayBuffer>>): void {
    this.result.push(input);
  }

  flush(next: Next<Uint8Array<ArrayBuffer>>): Uint8Array<ArrayBuffer> {
    const result = new Uint8Array(this.result);
    this.result = [];
    next(result);
    return result;
  }

  catch(error: unknown): void {
    this.result = [];
  }
}

class ToUint8ArrayWithOut<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> implements IPipe<number, Uint8Array<TArrayBuffer>, Uint8Array<TArrayBuffer>>
{
  private index = 0;

  constructor(private out: Uint8Array<TArrayBuffer>) {}

  transform(input: number, next: Next<Uint8Array<TArrayBuffer>>): void {
    this.out[this.index++] = input;
  }

  flush(next: Next<Uint8Array<TArrayBuffer>>): Uint8Array<TArrayBuffer> {
    const { out } = this;
    this.index = 0;
    next(out);
    return out;
  }

  catch(error: unknown): void {
    this.index = 0;
  }
}

class ToUint8ArrayWithCount<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> implements
    IPipe<
      number,
      { buffer: Uint8Array<TArrayBuffer>; written: number },
      { buffer: Uint8Array<TArrayBuffer>; written: number }
    >
{
  private index = 0;

  constructor(private out: Uint8Array<TArrayBuffer>) {}

  transform(
    input: number,
    next: Next<{ buffer: Uint8Array<TArrayBuffer>; written: number }>,
  ): void {
    this.out[this.index++] = input;
  }

  flush(next: Next<{ buffer: Uint8Array<TArrayBuffer>; written: number }>): {
    buffer: Uint8Array<TArrayBuffer>;
    written: number;
  } {
    const { out, index } = this;
    const result = { buffer: out, written: index };
    this.index = 0;
    next(result);
    return result;
  }

  catch(error: unknown): void {
    this.index = 0;
  }
}
