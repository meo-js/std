/**
 * @module
 * @public
 */
import { utf8 } from './encoding/text.js';
import { every, Pipe, type IPipe, type Next } from './pipe.js';
import { flatCodePoints } from './pipe/string.js';

// TODO: 实现 CBOR 以替代 JSON -> UTF8 Bytes 的序列化实现。
// 参考实现：
// - https://cbor.io
// - micro-cbor：https://www.npmjs.com/package/microcbor#benchmarks 已有的实现很规范（确定性编码），除了对 TypedArray 的处理。
// - cbor2：https://github.com/hildjj/cbor2 无循环引用处理。
// - cbor-x：https://github.com/kriszyp/cbor-x 有点乱，但实现得很全，但貌似不是（确定性编码）。
// 关于无法序列化的内容的参考实现：
// - https://github.com/shuding/stable-hash/blob/main/src/index.ts
// - https://github.com/tc39/proposal-composites/blob/main/polyfill/internal/hash.ts
// 自称最快的库（cbor-x），粗略地浏览后，没有特别的黑科技，可以在实现过程中偶尔参考一下。
// 增加 memoize 函数：https://www.npmjs.com/package/memoize?activeTab=readme
// 预计选项：
// 编码：
// - 是否确定性编码
// 解码：
// - 是否拷贝原数据缓冲区
// 预计可扩展性：
// 必须具有超灵活的可扩展性，以上参考实现都没有做到很好，但 cbor2 的 API 接口还行。
// 注意：
// - 数值的转换需符合规范，若规范不是很实用那么需增加选项
// 步骤：
// 1. 接入新的打包、测试、文档工具链
// 2. 拉取 CBOR 的测试用例，测试驱动开发
// 3. 先从基础的类型实现
// 4. 实现 fromJSON toJSON、dump。
// 5. 以扩展的形式增加 value-shared 等必要的扩展

export function serialize(input: unknown): Uint8Array {
    return utf8.encode(JSON.stringify(input));
}

export function deserialize<T>(input: Uint8Array): T {
    return JSON.parse(utf8.decode(input)) as T;
}

export function serializePipe() {
    return Pipe.create(new SerializePipe());
}

export function deserializePipe<T>() {
    return Pipe.create(new DeserializePipe<T>());
}

class SerializePipe implements IPipe<unknown, number> {
    // TODO: JSON 字符串直接拼接毫无意义，等待新的 CBOR 实现。

    transform(input: unknown, next: Next<number>): boolean {
        const str = JSON.stringify(input);
        // TODO: 以下演示了使用 every 实现管道内嵌套管道的方式，应该写进文档，然后是否可以提供更便捷、性能更高的嵌套方式？
        return Pipe.run(str, flatCodePoints(), utf8.encodePipe(), every(next));
    }

    flush(next: Next<number>): void {
        // do nothing.
    }

    catch(error: unknown): unknown {
        // do nothing.
        return error;
    }
}

class DeserializePipe<T> implements IPipe<number, T, T> {
    private bytes: number[] = [];

    transform(input: number, next: Next<T>): boolean {
        this.bytes.push(input);
        return true;
    }

    flush(next: Next<T>): T {
        try {
            const uint8Array = new Uint8Array(this.bytes);
            const result = deserialize<T>(uint8Array);
            this.bytes = [];
            next(result);
            return result;
        } catch (error) {
            this.bytes = [];
            throw error;
        }
    }

    catch(error: unknown): unknown {
        this.bytes = [];
        return error;
    }
}
