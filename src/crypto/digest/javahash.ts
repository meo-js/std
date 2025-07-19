import { utf8 } from "../../encoding/text.js";
import { Pipe, type IPipe, type Next } from "../../pipe.js";
import { isString } from "../../predicate.js";
import { asUint8Array } from "../../typed-array.js";

/**
 * 与 Java 中 hashCode 方法实现相同的非加密哈希函数
 *
 * 一般情况下没有任何理由使用这个函数。
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @returns 返回 32 位整数
 */
export function javahash(input: string | BufferSource): number {
    const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
    const len = data.length;

    let hash = 0;
    for (let i = 0; i < len; i++) {
        hash = (hash << 5) - hash + data[i];
        hash |= 0;
    }

    return hash;
}

/**
 * 创建一个计算 Java hashCode 的管道
 *
 * @returns 返回 Java hashCode 管道
 *
 * @see {@link javahash}
 */
export function javahashPipe() {
    return new Pipe(new JavaHashPipe());
}

/**
 * Java hashCode 管道实现。
 */
class JavaHashPipe implements IPipe<number, number, number> {
    private hash!: number;

    constructor() {
        this.reset();
    }

    transform(input: number, next: Next<number>): boolean {
        this.hash = (this.hash << 5) - this.hash + input;
        this.hash |= 0;
        return true;
    }

    flush(next: Next<number>): number {
        const result = this.hash;

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
