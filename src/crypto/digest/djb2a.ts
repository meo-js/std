import { utf8 } from "../../encoding/text.js";
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

const MAGIC_CONSTANT = 5381;

/**
 * DJB2-a 哈希管道实现
 */
class Djb2aPipe implements IPipe<number, number, number> {
    private hash!: number;

    constructor() {
        this.reset();
    }

    transform(input: number, next: Next<number>): boolean {
        this.hash = ((this.hash << 5) + this.hash) ^ input;
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
        this.hash = MAGIC_CONSTANT;
    }
}

/**
 * 创建一个计算 DJB2-a 哈希的管道
 *
 * @returns 返回 DJB2-a 哈希管道
 *
 * @see {@link djb2a}
 */
export function djb2aPipe() {
    return new Pipe(new Djb2aPipe());
}

/**
 * DJB2-a 非加密哈希函数
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @returns 返回 32 位整数
 */
export function djb2a(input: string | BufferSource): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let hash = MAGIC_CONSTANT;
    for (let i = 0; i < len; i++) {
        hash = ((hash << 5) + hash) ^ data[i];
    }

    return hash >>> 0;
}
