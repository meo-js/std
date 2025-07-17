import type { TypedArray } from "../typed-array.js";

/**
 * 环形缓冲区
 *
 * @template T - {@link TypedArray}
 */
export class CircleBuffer<T extends TypedArray = TypedArray> {
    /**
     * 已用空间
     */
    length = 0;

    /**
     * 缓冲区容量
     */
    get capacity(): number {
        return this.buffer.length;
    }

    /**
     * 剩余空间
     */
    get free(): number {
        return this.capacity - this.length;
    }

    /**
     * 缓冲区是否为空
     */
    get empty(): boolean {
        return this.length === 0;
    }

    /**
     * 缓冲区是否已满
     */
    get full(): boolean {
        return this.length === this.capacity;
    }

    private buffer: T;
    private tail = 0;
    private head = 0;
    private allowOverride = false;

    /**
     * 创建环形缓冲区
     *
     * @param typedArray 传入 {@link TypedArray} 实例作为存储空间
     * @param allowOverride 是否允许覆盖旧数据，默认为 `false`
     */
    constructor(typedArray: T, allowOverride = false) {
        this.buffer = typedArray;
        this.allowOverride = allowOverride;
    }

    /**
     * 写入元素
     *
     * @returns 是否写入成功
     */
    write(value: T[0]): boolean {
        if (this.full) {
            if (this.allowOverride) {
                this.buffer[this.head] = value;
                this.head = this.adjust(this.head, 1);
                this.tail = this.adjust(this.tail, 1);
            } else {
                return false;
            }
        } else {
            this.buffer[this.head] = value;
            this.head = this.adjust(this.head, 1);
            this.length++;
        }
        return true;
    }

    /**
     * 读取元素
     */
    read(): T[0] | undefined {
        if (this.empty) {
            return undefined;
        }

        const tail = this.tail;
        this.tail = this.adjust(tail, 1);
        this.length--;
        return this.buffer[tail];
    }

    /**
     * 查看元素
     */
    peek(offset = 0): T[0] | undefined {
        if (offset >= this.length || offset < 0) {
            return undefined;
        }

        const pos = this.adjust(this.tail, offset);
        return this.buffer[pos];
    }

    /**
     * 将写入指针移动指定次数
     */
    produce(count: number): boolean {
        if (count < 0) {
            return false;
        }

        if (this.allowOverride) {
            const newSize = Math.min(this.length + count, this.capacity);
            const overflow = this.length + count - this.capacity;

            this.head = this.adjust(this.head, count);

            if (overflow > 0) {
                this.tail = this.adjust(this.tail, overflow);
            }

            this.length = newSize;
        } else {
            if (count > this.free) {
                return false;
            }
            this.length += count;
            this.head = this.adjust(this.head, count);
        }

        return true;
    }

    /**
     * 将读取指针移动指定次数
     */
    consume(count: number): boolean {
        if (count < 0 || count > this.length) {
            return false;
        }

        this.tail = this.adjust(this.tail, count);
        this.length -= count;

        return true;
    }

    /**
     * 获取指定偏移量的指针
     */
    private adjust(pos: number, offset: number): number {
        return (pos + offset) % this.capacity;
    }

    /**
     * 清空缓冲区
     */
    clear(): void {
        this.head = 0;
        this.tail = 0;
        this.length = 0;
    }
}
