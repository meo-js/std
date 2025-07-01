import { utf8 } from "../../encoding/text.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

const M = 3332679571;

/**
 * MurmurHash1 32 位非加密哈希函数
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
export function murmurhash1(input: string | BufferSource, seed = 0): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let h = Math.imul(len, M) ^ seed;
    let i = 0;

    for (let b = len & -4; i < b; i += 4) {
        h +=
            (data[i + 3] << 24)
            | (data[i + 2] << 16)
            | (data[i + 1] << 8)
            | data[i];
        h = Math.imul(h, M);
        h ^= h >>> 16;
    }

    const t = (len & 3) as 1 | 2 | 3;
    switch (t) {
        // @ts-expect-error -- ts7029 checked.
        case 3:
            h += data[i + 2] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 2:
            h += data[i + 1] << 8;
        // eslint-disable-next-line no-fallthrough -- checked.
        case 1:
            h += data[i];
            h = Math.imul(h, M);
            h ^= h >>> 16;
    }

    h = Math.imul(h, M);
    h ^= h >>> 10;
    h = Math.imul(h, M);
    h ^= h >>> 17;

    return h >>> 0;
}
