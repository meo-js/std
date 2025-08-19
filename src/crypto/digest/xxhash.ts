import { utf8 } from '../../encoding/text.js';
import { isString } from '../../predicate.js';
import { asUint8Array, type AnyBufferSource } from '../../typed-array.js';

const P1 = 2654435761;
const P2 = 2246822519;
const P3 = 3266489917;
const P4 = 668265263;
const P5 = 374761393;

/**
 * xxHash 32 位非加密哈希函数
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
export function xxhash(input: string | AnyBufferSource, seed = 0): number {
  const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
  const len = data.length;

  let v0 = (seed + P5) | 0;
  let v1 = (seed + P1 + P2) | 0;
  let v2 = (seed + P2) | 0;
  let v3 = seed | 0;
  let v4 = (seed - P1) | 0;
  let i = 0;

  if (len >= 16) {
    while (i <= len - 16) {
      v1 += Math.imul(
        (data[i + 3] << 24)
          | (data[i + 2] << 16)
          | (data[i + 1] << 8)
          | data[i],
        P2,
      );
      i += 4;
      v1 = Math.imul((v1 << 13) | (v1 >>> 19), P1);

      v2 += Math.imul(
        (data[i + 3] << 24)
          | (data[i + 2] << 16)
          | (data[i + 1] << 8)
          | data[i],
        P2,
      );
      i += 4;
      v2 = Math.imul((v2 << 13) | (v2 >>> 19), P1);

      v3 += Math.imul(
        (data[i + 3] << 24)
          | (data[i + 2] << 16)
          | (data[i + 1] << 8)
          | data[i],
        P2,
      );
      i += 4;
      v3 = Math.imul((v3 << 13) | (v3 >>> 19), P1);

      v4 += Math.imul(
        (data[i + 3] << 24)
          | (data[i + 2] << 16)
          | (data[i + 1] << 8)
          | data[i],
        P2,
      );
      i += 4;
      v4 = Math.imul((v4 << 13) | (v4 >>> 19), P1);
    }
    v0 =
      ((v1 << 1) | (v1 >>> 31))
      + ((v2 << 7) | (v2 >>> 25))
      + ((v3 << 12) | (v3 >>> 20))
      + ((v4 << 18) | (v4 >>> 14));
  }

  v0 += len;
  while (i <= len - 4) {
    v0 += Math.imul(
      (data[i + 3] << 24) | (data[i + 2] << 16) | (data[i + 1] << 8) | data[i],
      P3,
    );
    i += 4;
    v0 = Math.imul((v0 << 17) | (v0 >>> 15), P4);
  }

  while (i < len) {
    v0 += Math.imul(data[i++], P5);
    v0 = Math.imul((v0 << 11) | (v0 >>> 21), P1);
  }

  v0 = Math.imul(v0 ^ (v0 >>> 15), P2);
  v0 = Math.imul(v0 ^ (v0 >>> 13), P3);
  v0 ^= v0 >>> 16;

  return v0 >>> 0;
}
