import type { checked } from "../ts.js";
import type {
    ArrayBufferViewConstructor,
    ArrayBufferViewConstructorInstanceOf,
} from "../typed-array.js";
import { CircleBuffer } from "./circle-buffer.js";

/**
 * 双区域环形缓冲区
 *
 * 与 {@link CircleBuffer} 不同，{@link BipBuffer} 确保返回的数据块总是连续的，避免了边界处理的复杂性。
 */
export class BipBuffer<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
    /**
     * 缓冲区容量
     */
    get capacity(): number {
        return this.buffer.byteLength;
    }

    /**
     * 已提交的空间
     *
     * 两个已提交区域空间的总和，这不代表 {@link read} 会返回的缓冲区大小
     */
    get committedLength(): number {
        return this.aEnd - this.aStart + (this.bEnd - this.bStart);
    }

    /**
     * 当前预留的空间
     */
    get reservedLength(): number {
        return this.rEnd - this.rStart;
    }

    /**
     * 缓冲区是否为空
     *
     * 仅当没有预留或提交任何空间时返回 `true`。
     */
    get empty(): boolean {
        return this.reservedLength === 0 && this.committedLength === 0;
    }

    private buffer: TArrayBuffer;
    private aStart: number = 0;
    private aEnd: number = 0;
    private bStart: number = 0;
    private bEnd: number = 0;
    private rStart: number = 0;
    private rEnd: number = 0;

    /**
     * @param arraybuffer 传入 {@link ArrayBufferLike} 实例作为存储空间
     */
    constructor(arraybuffer: TArrayBuffer) {
        this.buffer = arraybuffer;
    }

    /**
     * 预留指定大小的连续空间用于写入数据
     *
     * 如果可用空间小于请求的大小，则会返回所有可用空间。
     *
     * @param viewCtor {@link ArrayBufferView} 构造函数
     * @param length 请求的空间大小
     * @returns 用于访问可用空间的 {@link ArrayBufferView}，如果没有可用空间或已存在预留空间则返回 `null`
     */
    reserve<T extends ArrayBufferViewConstructor>(
        viewCtor: T,
        length: number,
    ): ArrayBufferViewConstructorInstanceOf<T, TArrayBuffer> | null {
        if (this.reservedLength !== 0) {
            return null;
        }

        let reserveStart: number;
        let freeSpace: number;

        if (this.bEnd - this.bStart > 0) {
            // B 区域存在，在 B 区域后预留
            reserveStart = this.bEnd;
            freeSpace = this.aStart - this.bEnd;
        } else {
            // B 区域不存在
            const spaceAfterA = this.capacity - this.aEnd;
            if (spaceAfterA >= this.aStart) {
                // A 区域后的空间更大或相等
                reserveStart = this.aEnd;
                freeSpace = spaceAfterA;
            } else {
                // A 区域前的空间更大
                reserveStart = 0;
                freeSpace = this.aStart;
            }
        }

        if (freeSpace === 0) {
            return null;
        }

        const reserveLength = Math.min(freeSpace, length);
        this.rStart = reserveStart;
        this.rEnd = reserveStart + reserveLength;

        return new viewCtor(this.buffer, this.rStart, reserveLength) as checked;
    }

    /**
     * 提交预留区域中的数据，使其可供读取
     *
     * 如果预留空间小于提交的大小，则会提交所有预留空间。
     *
     * 如果传入长度为 `0` 则表示直接丢弃预留区域空间。
     *
     * @param length 要提交的空间大小
     */
    commit(length: number): number {
        if (length === 0) {
            this.rStart = 0;
            this.rEnd = 0;
            return 0;
        }

        const toCommit = Math.min(length, this.rEnd - this.rStart);

        if (this.aEnd - this.aStart === 0 && this.bEnd - this.bStart === 0) {
            // 两个区域都为空，创建新的 A 区域
            this.aStart = this.rStart;
            this.aEnd = this.rStart + toCommit;
        } else if (this.rStart === this.aEnd) {
            // 预留紧接在 A 区域后，扩展 A 区域
            this.aEnd += toCommit;
        } else {
            // 扩展 B 区域
            this.bEnd += toCommit;
        }

        this.rStart = 0;
        this.rEnd = 0;

        return toCommit;
    }

    /**
     * 获取待读取的连续数据块
     *
     * @returns 用于访问待读取空间的 {@link ArrayBufferView}，如果没有待读取空间则返回 `null`
     */
    read<T extends ArrayBufferViewConstructor>(
        viewCtor: T,
    ): ArrayBufferViewConstructorInstanceOf<T, TArrayBuffer> | null {
        if (this.aEnd - this.aStart === 0) {
            return null;
        }
        return new viewCtor(
            this.buffer,
            this.aStart,
            this.aEnd - this.aStart,
        ) as checked;
    }

    /**
     * 标记指定数量的数据已被读取
     *
     * @param length 要标记为已读取的数据长度
     */
    decommit(length: number): void {
        if (length >= this.aEnd - this.aStart) {
            // 完全处理了 A 区域，将 B 区域移动到 A
            this.aStart = this.bStart;
            this.aEnd = this.bEnd;
            this.bStart = 0;
            this.bEnd = 0;
        } else {
            // 部分处理 A 区域
            this.aStart += length;
        }
    }

    /**
     * 清空缓冲区
     */
    clear(): void {
        this.aStart = 0;
        this.aEnd = 0;
        this.bStart = 0;
        this.bEnd = 0;
        this.rStart = 0;
        this.rEnd = 0;
    }
}
