import type { Poolable } from "../protocol/poolable.js";

/**
 * 池对象类型
 */
export type PoolItem = Poolable & Partial<Disposable>;

/**
 * 池对象句柄
 */
export class PoolItemHandle<out T extends PoolItem = object>
    implements Disposable
{
    constructor(
        private pool: { put(item: T): void },
        private item: T | null,
    ) {
        this.item = item;
    }

    /**
     * 池对象
     */
    get object() {
        return this.item;
    }

    /**
     * @inheritdoc
     */
    [Symbol.dispose](): void {
        const item = this.item;
        if (this.item) {
            this.pool.put(this.item);
            this.item = null;
        }
    }

    /**
     * 释放
     */
    dispose(): void {
        this[Symbol.dispose]();
    }
}
