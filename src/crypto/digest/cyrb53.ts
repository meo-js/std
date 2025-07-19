import { utf8 } from "../../encoding/text.js";
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

/**
 * Cyclic Redundancy Check 53 位非加密哈希函数
 *
 * 一个简单、快速且均匀分布的 53 位散列函数，与著名的 MurmurHash/xxHash 算法大致相似，碰撞率低于任何 32 位哈希函数。
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 53 位整数
 */
// Copied from GitHub user: @bryc.
export function cyrb53(input: string | BufferSource, seed = 0): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;

    for (let i = 0; i < len; i++) {
        const ch = data[i];
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    return computeResult(h1, h2);
}

/**
 * 创建一个计算 CYRB53 哈希的管道.
 *
 * @param seed 指定种子值，默认为 `0`
 * @returns 返回 CYRB53 哈希管道
 *
 * @see {@link cyrb53}
 */
export function cyrb53Pipe(seed?: number) {
    return new Pipe(new Cyrb53Pipe(seed));
}

/**
 * CYRB53 哈希管道实现.
 */
class Cyrb53Pipe implements IPipe<number, number, number> {
    private h1!: number;
    private h2!: number;
    private seed: number;

    constructor(seed = 0) {
        this.seed = seed;
        this.reset();
    }

    transform(input: number, next: Next<number>): boolean {
        const ch = input;
        this.h1 = Math.imul(this.h1 ^ ch, 2654435761);
        this.h2 = Math.imul(this.h2 ^ ch, 1597334677);
        return true;
    }

    flush(next: Next<number>): number {
        const { h1, h2 } = this;
        const result = computeResult(h1, h2);

        this.reset();
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.h1 = 0xdeadbeef ^ this.seed;
        this.h2 = 0x41c6ce57 ^ this.seed;
    }
}

function computeResult(h1: number, h2: number): number {
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
