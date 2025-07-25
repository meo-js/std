import type { Class } from "../class.js";
import { ROOKIE } from "../macro.js";
import { isDisposable, isFunction } from "../predicate.js";
import { reportDuplicatePut } from "./error.js";
import type { PlainPoolHandler } from "./handler.js";
import { PoolItemHandle, type PoolItem } from "./item.js";

/**
 * 轻量对象池
 *
 * 相比其它对象池，{@link PlainPool} 是最轻量、最高性能的对象池实现：
 * - 几乎是对象数组操作的简单封装，无额外性能开销
 * - 无使用量上限，对象池为空时，按指数增长扩容
 * - 无驱逐和自动缩减策略
 *
 * 注意：必须确保对象会被放回池中，否则可能导致内存泄漏。
 */
export class PlainPool<out T extends PoolItem = object> implements Disposable {
    /**
     * 创建对象池
     */
    static create<T extends PoolItem>(
        handler: (() => T) | PlainPoolHandler<T>,
        initialSize: number = 0,
    ): PlainPool<T> {
        return new PlainPool<T>(
            isFunction(handler) ? { ctor: handler } : handler,
            initialSize,
        );
    }

    /**
     * 使用指定类快速创建对象池
     */
    static fromClass<T extends PoolItem>(
        cls: Class<T>,
        initialSize: number = 0,
    ): PlainPool<T> {
        return new PlainPool<T>(
            {
                ctor: () => new cls(),
            },
            initialSize,
        );
    }

    /**
     * 池内对象数量
     */
    get size() {
        return this.arr.length;
    }

    /**
     * 可用对象数量
     */
    get availableCount() {
        return this.size - this.ptr;
    }

    private arr: T[] = [];
    private ptr = 0;
    private handler: PlainPoolHandler<T>;

    protected constructor(handler: PlainPoolHandler<T>, initialSize: number) {
        this.handler = handler;
        this.grow(initialSize);
    }

    /**
     * 构造指定数量的新对象放入对象池
     */
    grow(num: number) {
        if (num <= 0) return;
        while (num-- > 0) {
            const item = this.handler.ctor();
            this.arr.push(item);
        }
    }

    /**
     * 获取对象
     */
    get(): T {
        this._growIfNeeded();
        return this.arr[this.ptr++];
    }

    protected _growIfNeeded() {
        if (this.ptr >= this.size) {
            this.grow(Math.max(8, this.size >> 1));
        }
    }

    /**
     * 获取对象句柄
     */
    acquire() {
        const item = this.get();
        return new PoolItemHandle<T>(this, item);
    }

    /**
     * 返还对象
     */
    put(item: T) {
        if (ROOKIE) {
            if (!this.putInplace(item)) {
                reportDuplicatePut();
            }
            return;
        }

        if (this.ptr <= 0) {
            this.arr.push(item);
        } else {
            this.arr[--this.ptr] = item;
        }
    }

    /**
     * 返还对象
     *
     * 与 {@link put} 方法不同的是，此方法不会打乱内部对象的存储，但性能较差。
     *
     * @returns 返回是否成功返还，如果对象重复返还则返回 `false`。
     */
    putInplace(item: T): boolean {
        const index = this.arr.indexOf(item);
        if (index >= this.ptr) return false;

        if (index === -1) {
            this.arr.push(item);
        } else {
            if (index !== --this.ptr) {
                this.arr[index] = this.arr[this.ptr];
                this.arr[this.ptr] = item;
            }
        }

        return true;
    }

    /**
     * 返还所有对象
     *
     * 注意：使用 {@link put} 方法会打乱内部存储，请勿与此方法同时使用，可改用 {@link putInplace} 方法。
     */
    putAll() {
        this.ptr = 0;
    }

    /**
     * 释放池内多余的可用对象以收缩对象池的大小到指定值
     *
     * 只会释放池内未使用的对象，不会保证一定能收缩到指定的大小。
     *
     * @param size 指定值
     * @returns 返回收缩后的对象池大小
     */
    shrink(size: number): number {
        if (size >= this.size) return this.size;
        let num = this.size - size;
        while (num-- > 0 && this.availableCount > 0) {
            this._dispose(this.arr.pop()!);
        }
        return this.size;
    }

    /**
     * 清空池内所有的对象
     *
     * 注意：可能导致正在使用的池对象被释放。
     */
    clear() {
        for (let i = 0; i < this.arr.length; i++) {
            const item = this.arr[i];
            this._dispose(item);
        }
        this.arr.length = 0;
    }

    private _dispose(item: T) {
        if (this.handler.dispose) {
            this.handler.dispose(item);
        } else {
            if (isDisposable(item)) {
                item[Symbol.dispose]();
            }
        }
    }

    /**
     * @inheritdoc
     */
    [Symbol.dispose]() {
        this.clear();
        this.handler = null!;
    }

    /**
     * 释放对象池
     *
     * 释放后请勿再使用该对象池。
     */
    dispose() {
        this[Symbol.dispose]();
    }
}
