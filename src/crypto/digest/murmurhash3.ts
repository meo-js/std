import { utf8 } from "../../encoding/text.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

// MurmurHash3 constants
const P1 = 3432918353;
const P2 = 461845907;

// MurmurHash3_x86_128 constants
const P1_128 = 597399067;
const P2_128 = 2869860233;
const P3_128 = 951274213;
const P4_128 = 2716044179;

// MurmurHash3_x64_128 constants
const C1_X64: [number, number] = [0x87c37b91, 0x114253d5];
const C2_X64: [number, number] = [0x4cf5ad43, 0x2745937f];

function fmix32(h: number): number {
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h;
}

function x64Add(m: [number, number], n: [number, number]): [number, number] {
    const mParts = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    const nParts = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    const result = [0, 0, 0, 0];

    result[3] += mParts[3] + nParts[3];
    result[2] += result[3] >>> 16;
    result[3] &= 0xffff;

    result[2] += mParts[2] + nParts[2];
    result[1] += result[2] >>> 16;
    result[2] &= 0xffff;

    result[1] += mParts[1] + nParts[1];
    result[0] += result[1] >>> 16;
    result[1] &= 0xffff;

    result[0] += mParts[0] + nParts[0];
    result[0] &= 0xffff;

    return [(result[0] << 16) | result[1], (result[2] << 16) | result[3]];
}

function x64Multiply(
    m: [number, number],
    n: [number, number],
): [number, number] {
    const mParts = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    const nParts = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    const result = [0, 0, 0, 0];

    result[3] += mParts[3] * nParts[3];
    result[2] += result[3] >>> 16;
    result[3] &= 0xffff;

    result[2] += mParts[2] * nParts[3];
    result[1] += result[2] >>> 16;
    result[2] &= 0xffff;

    result[2] += mParts[3] * nParts[2];
    result[1] += result[2] >>> 16;
    result[2] &= 0xffff;

    result[1] += mParts[1] * nParts[3];
    result[0] += result[1] >>> 16;
    result[1] &= 0xffff;

    result[1] += mParts[2] * nParts[2];
    result[0] += result[1] >>> 16;
    result[1] &= 0xffff;

    result[1] += mParts[3] * nParts[1];
    result[0] += result[1] >>> 16;
    result[1] &= 0xffff;

    result[0] +=
        mParts[0] * nParts[3]
        + mParts[1] * nParts[2]
        + mParts[2] * nParts[1]
        + mParts[3] * nParts[0];
    result[0] &= 0xffff;

    return [(result[0] << 16) | result[1], (result[2] << 16) | result[3]];
}

function x64Rotl(m: [number, number], n: number): [number, number] {
    n %= 64;

    if (n === 32) {
        return [m[1], m[0]];
    } else if (n < 32) {
        return [
            (m[0] << n) | (m[1] >>> (32 - n)),
            (m[1] << n) | (m[0] >>> (32 - n)),
        ];
    } else {
        n -= 32;
        return [
            (m[1] << n) | (m[0] >>> (32 - n)),
            (m[0] << n) | (m[1] >>> (32 - n)),
        ];
    }
}

function x64LeftShift(m: [number, number], n: number): [number, number] {
    n %= 64;

    if (n === 0) {
        return m;
    } else if (n < 32) {
        return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
    } else {
        return [m[1] << (n - 32), 0];
    }
}

function x64Xor(m: [number, number], n: [number, number]): [number, number] {
    return [m[0] ^ n[0], m[1] ^ n[1]];
}

function x64Fmix(h: [number, number]): [number, number] {
    h = x64Xor(h, [0, h[0] >>> 1]);
    h = x64Multiply(h, [0xff51afd7, 0xed558ccd]);
    h = x64Xor(h, [0, h[0] >>> 1]);
    h = x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
    h = x64Xor(h, [0, h[0] >>> 1]);
    return h;
}

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

    h = fmix32(h);

    return h >>> 0;
}

/**
 * MurmurHash3 128 位非加密哈希函数
 *
 * 又名 `MurmurHash3_x86_128`，输出四个 32 位哈希值。
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回包含四个 32 位整数的 Uint32Array
 */
export function murmurhash3_128(
    input: string | BufferSource,
    seed = 0,
): Uint32Array {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let h1 = seed | 0;
    let h2 = seed | 0;
    let h3 = seed | 0;
    let h4 = seed | 0;

    let k1 = 0;
    let k2 = 0;
    let k3 = 0;
    let k4 = 0;

    let i = 0;
    for (let b = len & -16; i < b; i += 16) {
        k1 =
            (data[i + 3] << 24)
            | (data[i + 2] << 16)
            | (data[i + 1] << 8)
            | data[i];
        k1 = Math.imul(k1, P1_128);
        k1 = (k1 << 15) | (k1 >>> 17);
        h1 ^= Math.imul(k1, P2_128);
        h1 = (h1 << 19) | (h1 >>> 13);
        h1 += h2;
        h1 = (Math.imul(h1, 5) + 1444728091) | 0;

        k2 =
            (data[i + 7] << 24)
            | (data[i + 6] << 16)
            | (data[i + 5] << 8)
            | data[i + 4];
        k2 = Math.imul(k2, P2_128);
        k2 = (k2 << 16) | (k2 >>> 16);
        h2 ^= Math.imul(k2, P3_128);
        h2 = (h2 << 17) | (h2 >>> 15);
        h2 += h3;
        h2 = (Math.imul(h2, 5) + 197830471) | 0;

        k3 =
            (data[i + 11] << 24)
            | (data[i + 10] << 16)
            | (data[i + 9] << 8)
            | data[i + 8];
        k3 = Math.imul(k3, P3_128);
        k3 = (k3 << 17) | (k3 >>> 15);
        h3 ^= Math.imul(k3, P4_128);
        h3 = (h3 << 15) | (h3 >>> 17);
        h3 += h4;
        h3 = (Math.imul(h3, 5) + 2530024501) | 0;

        k4 =
            (data[i + 15] << 24)
            | (data[i + 14] << 16)
            | (data[i + 13] << 8)
            | data[i + 12];
        k4 = Math.imul(k4, P4_128);
        k4 = (k4 << 18) | (k4 >>> 14);
        h4 ^= Math.imul(k4, P1_128);
        h4 = (h4 << 13) | (h4 >>> 19);
        h4 += h1;
        h4 = (Math.imul(h4, 5) + 850148119) | 0;
    }

    k1 = 0;
    k2 = 0;
    k3 = 0;
    k4 = 0;

    const t = len & 15;
    switch (t) {
        // @ts-expect-error -- ts7029 checked.
        case 15:
            k4 ^= data[i + 14] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 14:
            k4 ^= data[i + 13] << 8;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 13:
            k4 ^= data[i + 12];
            k4 = Math.imul(k4, P4_128);
            k4 = (k4 << 18) | (k4 >>> 14);
            h4 ^= Math.imul(k4, P1_128);
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 12:
            k3 ^= data[i + 11] << 24;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 11:
            k3 ^= data[i + 10] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 10:
            k3 ^= data[i + 9] << 8;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 9:
            k3 ^= data[i + 8];
            k3 = Math.imul(k3, P3_128);
            k3 = (k3 << 17) | (k3 >>> 15);
            h3 ^= Math.imul(k3, P4_128);
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 8:
            k2 ^= data[i + 7] << 24;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 7:
            k2 ^= data[i + 6] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 6:
            k2 ^= data[i + 5] << 8;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 5:
            k2 ^= data[i + 4];
            k2 = Math.imul(k2, P2_128);
            k2 = (k2 << 16) | (k2 >>> 16);
            h2 ^= Math.imul(k2, P3_128);
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 4:
            k1 ^= data[i + 3] << 24;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 3:
            k1 ^= data[i + 2] << 16;
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 2:
            k1 ^= data[i + 1] << 8;
        // eslint-disable-next-line no-fallthrough -- checked.
        case 1:
            k1 ^= data[i];
            k1 = Math.imul(k1, P1_128);
            k1 = (k1 << 15) | (k1 >>> 17);
            h1 ^= Math.imul(k1, P2_128);
            break;
        default:
            break;
    }

    h1 ^= len;
    h2 ^= len;
    h3 ^= len;
    h4 ^= len;

    h1 += h2;
    h1 += h3;
    h1 += h4;
    h2 += h1;
    h3 += h1;
    h4 += h1;

    h1 = fmix32(h1);
    h2 = fmix32(h2);
    h3 = fmix32(h3);
    h4 = fmix32(h4);

    h1 += h2;
    h1 += h3;
    h1 += h4;
    h2 += h1;
    h3 += h1;
    h4 += h1;

    const array = new Uint32Array(4);
    array[0] = h1 >>> 0;
    array[1] = h2 >>> 0;
    array[2] = h3 >>> 0;
    array[3] = h4 >>> 0;

    return array;
}

/**
 * MurmurHash3 x64 128 位非加密哈希函数
 *
 * 又名 `MurmurHash3_x64_128`，使用64位运算，输出四个 32 位哈希值。
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回包含四个 32 位整数的 Uint32Array
 */
export function murmurhash3_x64_128(
    input: string | BufferSource,
    seed = 0,
): Uint32Array {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;
    const remainder = len % 16;
    const blocks = len - remainder;

    let h1: [number, number] = [0, seed];
    let h2: [number, number] = [0, seed];

    let k1: [number, number] = [0, 0];
    let k2: [number, number] = [0, 0];

    let i = 0;
    for (; i < blocks; i += 16) {
        k1 = [
            data[i + 4]
                | (data[i + 5] << 8)
                | (data[i + 6] << 16)
                | (data[i + 7] << 24),
            data[i]
                | (data[i + 1] << 8)
                | (data[i + 2] << 16)
                | (data[i + 3] << 24),
        ];
        k2 = [
            data[i + 12]
                | (data[i + 13] << 8)
                | (data[i + 14] << 16)
                | (data[i + 15] << 24),
            data[i + 8]
                | (data[i + 9] << 8)
                | (data[i + 10] << 16)
                | (data[i + 11] << 24),
        ];

        k1 = x64Multiply(k1, C1_X64);
        k1 = x64Rotl(k1, 31);
        k1 = x64Multiply(k1, C2_X64);
        h1 = x64Xor(h1, k1);

        h1 = x64Rotl(h1, 27);
        h1 = x64Add(h1, h2);
        h1 = x64Add(x64Multiply(h1, [0, 5]), [0, 0x52dce729]);

        k2 = x64Multiply(k2, C2_X64);
        k2 = x64Rotl(k2, 33);
        k2 = x64Multiply(k2, C1_X64);
        h2 = x64Xor(h2, k2);

        h2 = x64Rotl(h2, 31);
        h2 = x64Add(h2, h1);
        h2 = x64Add(x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
    }

    k1 = [0, 0];
    k2 = [0, 0];

    const t = remainder;
    switch (t) {
        // @ts-expect-error -- ts7029 checked.
        case 15:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 14]], 48));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 14:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 13]], 40));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 13:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 12]], 32));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 12:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 11]], 24));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 11:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 10]], 16));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 10:
            k2 = x64Xor(k2, x64LeftShift([0, data[i + 9]], 8));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 9:
            k2 = x64Xor(k2, [0, data[i + 8]]);
            k2 = x64Multiply(k2, C2_X64);
            k2 = x64Rotl(k2, 33);
            k2 = x64Multiply(k2, C1_X64);
            h2 = x64Xor(h2, k2);
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 8:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 7]], 56));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 7:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 6]], 48));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 6:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 5]], 40));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 5:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 4]], 32));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 4:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 3]], 24));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 3:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 2]], 16));
        // @ts-expect-error -- ts7029 checked.
        // eslint-disable-next-line no-fallthrough -- checked.
        case 2:
            k1 = x64Xor(k1, x64LeftShift([0, data[i + 1]], 8));
        // eslint-disable-next-line no-fallthrough -- checked.
        case 1:
            k1 = x64Xor(k1, [0, data[i]]);
            k1 = x64Multiply(k1, C1_X64);
            k1 = x64Rotl(k1, 31);
            k1 = x64Multiply(k1, C2_X64);
            h1 = x64Xor(h1, k1);
            break;
        default:
            break;
    }

    h1 = x64Xor(h1, [0, len]);
    h2 = x64Xor(h2, [0, len]);

    h1 = x64Add(h1, h2);
    h2 = x64Add(h2, h1);

    h1 = x64Fmix(h1);
    h2 = x64Fmix(h2);

    h1 = x64Add(h1, h2);
    h2 = x64Add(h2, h1);

    const array = new Uint32Array(4);
    array[0] = h1[0] >>> 0;
    array[1] = h1[1] >>> 0;
    array[2] = h2[0] >>> 0;
    array[3] = h2[1] >>> 0;

    return array;
}
