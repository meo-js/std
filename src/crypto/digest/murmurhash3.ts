import { utf8 } from "../../encoding/text.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

const P1 = 3432918353;
const P2 = 461845907;

/**
 * MurmurHash3 32 位非加密哈希函数
 *
 * 又名 `MurmurHash3_x86_32`。
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
export function murmurhash3(input: string | BufferSource, seed = 0): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let h = seed | 0;
    let i = 0;
    let k = 0;

    for (let b = len & -4; i < b; i += 4) {
        k =
            (data[i + 3] << 24)
            | (data[i + 2] << 16)
            | (data[i + 1] << 8)
            | data[i];
        k = Math.imul(k, P1);
        k = (k << 15) | (k >>> 17);
        h ^= Math.imul(k, P2);
        h = (h << 13) | (h >>> 19);
        h = (Math.imul(h, 5) + 3864292196) | 0;
    }

    k = 0;
    const t = (len & 3) as 1 | 2 | 3;
    switch (t) {
        // @ts-expect-error -- ts7029 checked.
        case 3:
            k ^= data[i + 2] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 2:
            k ^= data[i + 1] << 8;
        // eslint-disable-next-line no-fallthrough -- checked.
        case 1:
            k ^= data[i];
            k = Math.imul(k, P1);
            k = (k << 15) | (k >>> 17);
            h ^= Math.imul(k, P2);
    }

    h ^= len;

    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;

    return h >>> 0;
}
