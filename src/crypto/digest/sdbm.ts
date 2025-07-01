import { utf8 } from "../../encoding/text.js";
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

/**
 * SDBM 哈希管道实现
 */
class SdbmPipe implements IPipe<number, number, number> {
    private hash!: number;

    constructor() {
        this.reset();
    }

    transform(input: number, next: Next<number>): boolean {
        this.hash = input + (this.hash << 6) + (this.hash << 16) - this.hash;
        return true;
    }

    flush(next: Next<number>): number {
        const result = this.hash >>> 0;

        this.reset();
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.hash = 0;
    }
}

/**
 * 创建一个计算 SDBM 哈希的管道
 *
 * @returns 返回 SDBM 哈希管道
 *
 * @see {@link sdbm}
 */
export function sdbmPipe() {
    return new Pipe(new SdbmPipe());
}

/**
 * SDBM 非加密哈希函数
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @returns 返回 32 位整数
 */
export function sdbm(input: string | BufferSource): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = data[i] + (hash << 6) + (hash << 16) - hash;
    }

    return hash >>> 0;
}
