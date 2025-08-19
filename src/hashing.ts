/**
 * @public
 * @module
 */
import {
  cyrb53Pipe,
  sha256Pipe,
  type cyrb53,
  type sha256,
} from './crypto/digest.js';
import { hex } from './encoding/byte.js';
import { concatString, Pipe, type ISimplePipe } from './pipe.js';
import { serializePipe, type serialize } from './serialize.js';
import { asUint8Array } from './typed-array.js';

const toUint8: ISimplePipe<Uint32Array, number> = (input, next) => {
  const buffer = asUint8Array(input);
  for (let i = 0; i < buffer.length; i++) {
    if (!next(buffer[i])) {
      return false;
    }
  }
  return true;
};

/**
 * 计算任意值的非加密哈希码
 *
 * @see {@link serialize}
 * @see {@link cyrb53}
 */
export function getHashCode(value: unknown): number {
  // TODO: Class、symbol 这些无法序列化的值必须特殊处理
  return Pipe.run(value, serializePipe(), cyrb53Pipe());
}

/**
 * 计算任意值的加密哈希值
 *
 * @see {@link serialize}
 * @see {@link sha256}
 * @see {@link hex}
 */
export function getHash(value: unknown): string {
  // TODO: Class、symbol 这些无法序列化的值必须特殊处理
  return Pipe.run(
    value,
    serializePipe(),
    sha256Pipe(),
    toUint8,
    hex.encodePipe(),
    concatString(),
  );
}
