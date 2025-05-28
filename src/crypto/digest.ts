/**
 * @public
 *
 * @module
 */

import { HAS_BIGINT } from "../env.js";
import { throwBigIntNotSupported } from "../internal/error.js";
import { isString } from "../predicate.js";
import type { checked } from "../ts.js";
import { asUint8Array } from "../typed-array.js";

// explanation: https://stackoverflow.com/a/31621312/64949
const MAGIC_CONSTANT = 5381;

// FNV_PRIMES and FNV_OFFSETS from http://www.isthe.com/chongo/tech/comp/fnv/index.html#FNV-param
const FNV_PRIMES32 = 16777619;
const FNV_PRIMES = HAS_BIGINT
    ? {
          64: BigInt("1099511628211"),
          128: BigInt("309485009821345068724781371"),
          256: BigInt("374144419156711147060143317175368453031918731002211"),
          512: BigInt(
              "35835915874844867368919076489095108449946327955754392558399825615420669938882575126094039892345713852759",
          ),
          1024: BigInt(
              "5016456510113118655434598811035278955030765345404790744303017523831112055108147451509157692220295382716162651878526895249385292291816524375083746691371804094271873160484737966720260389217684476157468082573",
          ),
      }
    : undefined!;

const FNV_OFFSETS32 = 2166136261;
const FNV_OFFSETS = HAS_BIGINT
    ? {
          64: BigInt("14695981039346656037"),
          128: BigInt("144066263297769815596495629667062367629"),
          256: BigInt(
              "100029257958052580907070968620625704837092796014241193945225284501741471925557",
          ),
          512: BigInt(
              "965930312949666949800943540071631046609041874567263789610837432943443462657994582932197716438449813051892206539805784495328239340083876191928701583869517785",
          ),
          1024: BigInt(
              "141977950649476210687220706414032183208806227954419339608784749146178474914617582723252296732303717722150864096521202355549365628174669108571814760471015076148029755969804077320157692458563003215304957150157403644460363550505412711285966361610267868082893823963790439336411086884584107735010676915",
          ),
      }
    : undefined!;

/**
 * 与 Java 中 hashCode 方法实现相同的非加密哈希函数
 *
 * 一般情况下没有任何理由使用这个函数。
 *
 * @returns 返回 32 位整数
 */
export function javahash(input: string | BufferSource) {
    let hash = 0;

    if (isString(input)) {
        if (input.length === 0) return hash;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            // convert to 32bit integer
            hash |= 0;
        }
    } else {
        const buf = asUint8Array(input);
        if (buf.length === 0) return hash;
        for (let i = 0; i < buf.length; i++) {
            hash = (hash << 5) - hash + buf[i];
            // convert to 32bit integer
            hash |= 0;
        }
    }

    return hash;
}

/**
 * DJB2-a 非加密哈希函数
 *
 * @returns 返回 32 位整数
 */
// copy from djb2a: https://github.com/sindresorhus/djb2a
export function djb2a(input: string | BufferSource) {
    let hash = MAGIC_CONSTANT;

    if (isString(input)) {
        for (let index = 0; index < input.length; index++) {
            // equivalent to: `hash * 33 ^ string.charCodeAt(i)`
            hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
        }
    } else {
        const buf = asUint8Array(input);
        for (let index = 0; index < buf.length; index++) {
            // equivalent to: `hash * 33 ^ string.charCodeAt(i)`
            hash = ((hash << 5) + hash) ^ buf[index];
        }
    }

    // convert it to an unsigned 32-bit integer.
    return hash >>> 0;
}

/**
 * SDBM 非加密哈希函数
 *
 * @returns 返回 32 位整数
 */
// copy from sdbm: https://github.com/sindresorhus/sdbm
export function sdbm(input: string | BufferSource) {
    let hash = 0;

    if (isString(input)) {
        for (let i = 0; i < input.length; i++) {
            hash = input.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
        }
    } else {
        const buf = asUint8Array(input);
        for (let i = 0; i < buf.length; i++) {
            hash = buf[i] + (hash << 6) + (hash << 16) - hash;
        }
    }

    // convert it to an unsigned 32-bit integer.
    return hash >>> 0;
}

/**
 * FNV-1a 非加密哈希函数
 *
 * @param input 字符串或字节数据
 * @param size 指定哈希大小，默认为 `32`
 * @returns 若 {@link size} 为 `32`，则返回 32 位整数，否则返回相应位数的 `bigint`。
 */
// copy from fnv1a: https://github.com/sindresorhus/fnv1a
export function fnv1a<T extends 32 | 64 | 128 | 256 | 512 | 1024>(
    input: string | BufferSource,
    size: T = 32 as T,
): T extends 32 ? number : bigint {
    if (size === 32) {
        const fnvPrime = FNV_PRIMES32;
        let hash = FNV_OFFSETS32;

        if (isString(input)) {
            for (let index = 0; index < input.length; index++) {
                hash ^= input.charCodeAt(index);
                hash = Math.imul(hash, fnvPrime);
            }
        } else {
            const buf = asUint8Array(input);
            for (let index = 0; index < buf.length; index++) {
                hash ^= buf[index];
                hash = Math.imul(hash, fnvPrime);
            }
        }

        return (hash >>> 0) as checked;
    } else {
        if (!HAS_BIGINT) {
            throwBigIntNotSupported("fnv1a() with size > 32");
        }

        const fnvPrime = FNV_PRIMES[size as 64];
        let hash = FNV_OFFSETS[size as 64];
        if (isString(input)) {
            for (let index = 0; index < input.length; index++) {
                hash ^= BigInt(input.charCodeAt(index));
                hash = BigInt.asUintN(size, hash * fnvPrime);
            }
        } else {
            const buf = asUint8Array(input);
            for (let index = 0; index < buf.length; index++) {
                hash ^= BigInt(buf[index]);
                hash = BigInt.asUintN(size, hash * fnvPrime);
            }
        }

        return hash as checked;
    }
}

/**
 * Cyclic Redundancy Check 53 位非加密哈希函数
 *
 * 一个简单、快速且均匀分布的 53 位散列函数，与著名的 MurmurHash/xxHash 算法大致相似，碰撞率低于任何 32 位哈希函数。
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 53 位整数
 */
// copy from github user: @bryc
export function cyrb53(input: string | BufferSource, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;

    if (isString(input)) {
        for (let i = 0, ch; i < input.length; i++) {
            ch = input.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
    } else {
        const buf = asUint8Array(input);
        for (let i = 0, ch; i < buf.length; i++) {
            ch = buf[i];
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * MurmurHash1 32 位非加密哈希函数
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
// copy from github user: @bryc
export function murmurhash1(input: string | BufferSource, seed = 0) {
    const m = 3332679571;
    let h = 0;
    let i = 0;

    if (isString(input)) {
        h = Math.imul(input.length, m) ^ seed;

        for (let b = input.length & -4; i < b; i += 4) {
            h +=
                (input.charCodeAt(i + 3) << 24)
                | (input.charCodeAt(i + 2) << 16)
                | (input.charCodeAt(i + 1) << 8)
                | input.charCodeAt(i);
            h = Math.imul(h, m);
            h ^= h >>> 16;
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (input.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                h += input.charCodeAt(i + 2) << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                h += input.charCodeAt(i + 1) << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                h += input.charCodeAt(i);
                h = Math.imul(h, m);
                h ^= h >>> 16;
        }
    } else {
        const buf = asUint8Array(input);

        h = Math.imul(buf.length, m) ^ seed;

        for (let b = buf.length & -4; i < b; i += 4) {
            h +=
                (buf[i + 3] << 24)
                | (buf[i + 2] << 16)
                | (buf[i + 1] << 8)
                | buf[i];
            h = Math.imul(h, m);
            h ^= h >>> 16;
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (buf.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                h += buf[i + 2] << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                h += buf[i + 1] << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                h += buf[i];
                h = Math.imul(h, m);
                h ^= h >>> 16;
        }
    }

    h = Math.imul(h, m);
    h ^= h >>> 10;
    h = Math.imul(h, m);
    h ^= h >>> 17;

    return h >>> 0;
}

/**
 * MurmurHash2 32 位非加密哈希函数
 *
 * 又名 `MurmurHash2_x86_32`。
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
// copy from github user: @bryc
export function murmurhash2(input: string | BufferSource, seed = 0) {
    const m = 1540483477;
    let h = 0;
    let i = 0;
    let k = 0;

    if (isString(input)) {
        h = input.length ^ seed;

        for (let b = input.length & -4; i < b; i += 4) {
            k =
                (input.charCodeAt(i + 3) << 24)
                | (input.charCodeAt(i + 2) << 16)
                | (input.charCodeAt(i + 1) << 8)
                | input.charCodeAt(i);
            k = Math.imul(k, m);
            k ^= k >>> 24;
            h = Math.imul(h, m) ^ Math.imul(k, m);
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (input.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                h ^= input.charCodeAt(i + 2) << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                h ^= input.charCodeAt(i + 1) << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                h ^= input.charCodeAt(i);
                h = Math.imul(h, m);
        }
    } else {
        const buf = asUint8Array(input);

        h = buf.length ^ seed;

        for (let b = buf.length & -4; i < b; i += 4) {
            k =
                (buf[i + 3] << 24)
                | (buf[i + 2] << 16)
                | (buf[i + 1] << 8)
                | buf[i];
            k = Math.imul(k, m);
            k ^= k >>> 24;
            h = Math.imul(h, m) ^ Math.imul(k, m);
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (buf.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                h ^= buf[i + 2] << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                h ^= buf[i + 1] << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                h ^= buf[i];
                h = Math.imul(h, m);
        }
    }

    h ^= h >>> 13;
    h = Math.imul(h, m);
    h ^= h >>> 15;

    return h >>> 0;
}

/**
 * MurmurHash2A 32 位非加密哈希函数
 *
 * MurmurHash2 的改进版本。
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
// copy from github user: @bryc
export function murmurhash2a(input: string | BufferSource, seed = 0) {
    const m = 1540483477;
    let h = seed | 0;
    let i = 0;
    let k = 0;
    let l = 0;

    if (isString(input)) {
        for (let b = input.length & -4; i < b; i += 4) {
            k =
                (input.charCodeAt(i + 3) << 24)
                | (input.charCodeAt(i + 2) << 16)
                | (input.charCodeAt(i + 1) << 8)
                | input.charCodeAt(i);
            k = Math.imul(k, m);
            k ^= k >>> 24;
            h = Math.imul(h, m) ^ Math.imul(k, m);
        }

        k = 0;
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (input.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                k ^= input.charCodeAt(i + 2) << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                k ^= input.charCodeAt(i + 1) << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                k ^= input.charCodeAt(i);
        }

        k = Math.imul(k, m);
        k ^= k >>> 24;
        h = Math.imul(h, m) ^ Math.imul(k, m);
        l = Math.imul(input.length, m);
        l ^= l >>> 24;
        h = Math.imul(h, m) ^ Math.imul(l, m);
    } else {
        const buf = asUint8Array(input);

        for (let b = buf.length & -4; i < b; i += 4) {
            k =
                (buf[i + 3] << 24)
                | (buf[i + 2] << 16)
                | (buf[i + 1] << 8)
                | buf[i];
            k = Math.imul(k, m);
            k ^= k >>> 24;
            h = Math.imul(h, m) ^ Math.imul(k, m);
        }

        k = 0;
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (buf.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                k ^= buf[i + 2] << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                k ^= buf[i + 1] << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                k ^= buf[i];
        }

        k = Math.imul(k, m);
        k ^= k >>> 24;
        h = Math.imul(h, m) ^ Math.imul(k, m);
        l = Math.imul(buf.length, m);
        l ^= l >>> 24;
        h = Math.imul(h, m) ^ Math.imul(l, m);
    }

    h ^= h >>> 13;
    h = Math.imul(h, m);
    h ^= h >>> 15;

    return h >>> 0;
}

/**
 * MurmurHash3 32 位非加密哈希函数
 *
 * 又名 `MurmurHash3_x86_32`。
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
// copy from github user: @bryc
export function murmurhash3(input: string | BufferSource, seed = 0) {
    const p1 = 3432918353;
    const p2 = 461845907;
    let h = seed | 0;
    let i = 0;
    let k = 0;

    if (isString(input)) {
        for (let b = input.length & -4; i < b; i += 4) {
            k =
                (input.charCodeAt(i + 3) << 24)
                | (input.charCodeAt(i + 2) << 16)
                | (input.charCodeAt(i + 1) << 8)
                | input.charCodeAt(i);
            k = Math.imul(k, p1);
            k = (k << 15) | (k >>> 17);
            h ^= Math.imul(k, p2);
            h = (h << 13) | (h >>> 19);
            h = (Math.imul(h, 5) + 3864292196) | 0; // |0 = prevent float
        }

        k = 0;
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (input.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                k ^= input.charCodeAt(i + 2) << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                k ^= input.charCodeAt(i + 1) << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                k ^= input.charCodeAt(i);
                k = Math.imul(k, p1);
                k = (k << 15) | (k >>> 17);
                h ^= Math.imul(k, p2);
        }

        h ^= input.length;
    } else {
        const buf = asUint8Array(input);

        for (let b = buf.length & -4; i < b; i += 4) {
            k =
                (buf[i + 3] << 24)
                | (buf[i + 2] << 16)
                | (buf[i + 1] << 8)
                | buf[i];
            k = Math.imul(k, p1);
            k = (k << 15) | (k >>> 17);
            h ^= Math.imul(k, p2);
            h = (h << 13) | (h >>> 19);
            h = (Math.imul(h, 5) + 3864292196) | 0; // |0 = prevent float
        }

        k = 0;
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- checked.
        switch (buf.length & 3) {
            // @ts-expect-error -- ts7029 checked.
            case 3:
                k ^= buf[i + 2] << 16;
            // @ts-expect-error -- ts7029 checked.
            // eslint-disable-next-line no-fallthrough -- checked.
            case 2:
                k ^= buf[i + 1] << 8;
            // eslint-disable-next-line no-fallthrough -- checked.
            case 1:
                k ^= buf[i];
                k = Math.imul(k, p1);
                k = (k << 15) | (k >>> 17);
                h ^= Math.imul(k, p2);
        }

        h ^= buf.length;
    }

    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;

    return h >>> 0;
}

/**
 * xxHash 32 位非加密哈希函数
 *
 * @param input 字符串或字节数据
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 32 位整数
 */
// copy from github user: @bryc
export function xxhash(input: string | BufferSource, seed = 0) {
    const p1 = 2654435761;
    const p2 = 2246822519;
    const p3 = 3266489917;
    const p4 = 668265263;
    const p5 = 374761393;
    let v0 = (seed + p5) | 0;
    let v1 = (seed + p1 + p2) | 0;
    let v2 = (seed + p2) | 0;
    let v3 = seed | 0;
    let v4 = (seed - p1) | 0;
    let i = 0;

    if (isString(input)) {
        if (input.length >= 16) {
            while (i <= input.length - 16) {
                v1 += Math.imul(
                    (input.charCodeAt(i + 3) << 24)
                        | (input.charCodeAt(i + 2) << 16)
                        | (input.charCodeAt(i + 1) << 8)
                        | input.charCodeAt(i),
                    p2,
                );
                i += 4;
                v1 = Math.imul((v1 << 13) | (v1 >>> 19), p1);

                v2 += Math.imul(
                    (input.charCodeAt(i + 3) << 24)
                        | (input.charCodeAt(i + 2) << 16)
                        | (input.charCodeAt(i + 1) << 8)
                        | input.charCodeAt(i),
                    p2,
                );
                i += 4;
                v2 = Math.imul((v2 << 13) | (v2 >>> 19), p1);

                v3 += Math.imul(
                    (input.charCodeAt(i + 3) << 24)
                        | (input.charCodeAt(i + 2) << 16)
                        | (input.charCodeAt(i + 1) << 8)
                        | input.charCodeAt(i),
                    p2,
                );
                i += 4;
                v3 = Math.imul((v3 << 13) | (v3 >>> 19), p1);

                v4 += Math.imul(
                    (input.charCodeAt(i + 3) << 24)
                        | (input.charCodeAt(i + 2) << 16)
                        | (input.charCodeAt(i + 1) << 8)
                        | input.charCodeAt(i),
                    p2,
                );
                i += 4;
                v4 = Math.imul((v4 << 13) | (v4 >>> 19), p1);
            }
            v0 =
                ((v1 << 1) | (v1 >>> 31))
                + ((v2 << 7) | (v2 >>> 25))
                + ((v3 << 12) | (v3 >>> 20))
                + ((v4 << 18) | (v4 >>> 14));
        }

        v0 += input.length;
        while (i <= input.length - 4) {
            v0 += Math.imul(
                (input.charCodeAt(i + 3) << 24)
                    | (input.charCodeAt(i + 2) << 16)
                    | (input.charCodeAt(i + 1) << 8)
                    | input.charCodeAt(i),
                p3,
            );
            i += 4;
            v0 = Math.imul((v0 << 17) | (v0 >>> 15), p4);
        }

        while (i < input.length) {
            v0 += Math.imul(input.charCodeAt(i++), p5);
            v0 = Math.imul((v0 << 11) | (v0 >>> 21), p1);
        }
    } else {
        const buf = asUint8Array(input);

        if (buf.length >= 16) {
            while (i <= buf.length - 16) {
                v1 += Math.imul(
                    (buf[i + 3] << 24)
                        | (buf[i + 2] << 16)
                        | (buf[i + 1] << 8)
                        | buf[i],
                    p2,
                );
                i += 4;
                v1 = Math.imul((v1 << 13) | (v1 >>> 19), p1);

                v2 += Math.imul(
                    (buf[i + 3] << 24)
                        | (buf[i + 2] << 16)
                        | (buf[i + 1] << 8)
                        | buf[i],
                    p2,
                );
                i += 4;
                v2 = Math.imul((v2 << 13) | (v2 >>> 19), p1);

                v3 += Math.imul(
                    (buf[i + 3] << 24)
                        | (buf[i + 2] << 16)
                        | (buf[i + 1] << 8)
                        | buf[i],
                    p2,
                );
                i += 4;
                v3 = Math.imul((v3 << 13) | (v3 >>> 19), p1);

                v4 += Math.imul(
                    (buf[i + 3] << 24)
                        | (buf[i + 2] << 16)
                        | (buf[i + 1] << 8)
                        | buf[i],
                    p2,
                );
                i += 4;
                v4 = Math.imul((v4 << 13) | (v4 >>> 19), p1);
            }
            v0 =
                ((v1 << 1) | (v1 >>> 31))
                + ((v2 << 7) | (v2 >>> 25))
                + ((v3 << 12) | (v3 >>> 20))
                + ((v4 << 18) | (v4 >>> 14));
        }

        v0 += buf.length;
        while (i <= buf.length - 4) {
            v0 += Math.imul(
                (buf[i + 3] << 24)
                    | (buf[i + 2] << 16)
                    | (buf[i + 1] << 8)
                    | buf[i],
                p3,
            );
            i += 4;
            v0 = Math.imul((v0 << 17) | (v0 >>> 15), p4);
        }

        while (i < buf.length) {
            v0 += Math.imul(buf[i++], p5);
            v0 = Math.imul((v0 << 11) | (v0 >>> 21), p1);
        }
    }

    v0 = Math.imul(v0 ^ (v0 >>> 15), p2);
    v0 = Math.imul(v0 ^ (v0 >>> 13), p3);
    v0 ^= v0 >>> 16;

    return v0 >>> 0;
}
