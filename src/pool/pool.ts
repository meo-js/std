import type { Class } from "../class.js";
import { ROOKIE } from "../macro.js";
import { isNumber, type IsNever } from "../predicate.js";
import type { Poolable } from "../protocol.js";
import { recycle, reuse } from "../protocol/symbols.js";
import type { checked, Covariant, uncertain } from "../ts.js";
import type { If } from "../ts/logical.js";
import { reportDuplicatePut } from "./error.js";
import type { PoolHandler, PoolOptions } from "./handler.js";
import { PoolItemHandle, type PoolItem } from "./item.js";

type FinalArguments<
    T extends PoolItem,
    Arguments extends readonly unknown[],
> = If<IsNever<Arguments>, T extends Poolable<infer P> ? P : [], Arguments>;

/**
 * 描述从类创建的对象池类型
 */
// NOTE: 使用 `Pool<T>` 不会自动获得 reuse 函数参数类型
export type PoolOf<T extends PoolItem> =
    T extends Poolable<infer P> ? Pool<T, P> : Pool<T, []>;

/**
 * 对象池
 */
export class Pool<
    out T extends PoolItem = object,
    in Arguments extends readonly unknown[] = uncertain,
> implements Disposable
{
    /**
     * 创建对象池
     */
    // NOTE: 只有使用该函数创建才能获得 PoolItem 上的 reuse 函数参数类型
    static create<
        T extends PoolItem = object,
        Arguments extends readonly unknown[] = never,
    >(
        handler: PoolHandler<T, Arguments>,
        initialSize?: number,
    ): Pool<T, FinalArguments<T, Arguments>> {
        if (initialSize == null) {
            const capacity = handler.capacity ?? -1;
            if (capacity > 0) {
                initialSize = capacity;
            } else {
                initialSize = 0;
            }
        }
        return new Pool(handler, initialSize) as checked;
    }

    /**
     * 使用指定类快速创建对象池
     */
    static fromClass<
        T extends PoolItem = object,
        Arguments extends readonly unknown[] = never,
    >(
        cls: Class<T>,
        initialSize?: number,
    ): Pool<T, FinalArguments<T, Arguments>>;
    static fromClass<
        T extends PoolItem = object,
        Arguments extends readonly unknown[] = never,
    >(
        cls: Class<T>,
        opts: PoolOptions,
        initialSize?: number,
    ): Pool<T, FinalArguments<T, Arguments>>;
    static fromClass<
        T extends PoolItem = object,
        Arguments extends readonly unknown[] = never,
    >(
        cls: Class<T>,
        arg2?: PoolOptions | number,
        initialSize?: number,
    ): Pool<T, FinalArguments<T, Arguments>> {
        let opts: PoolOptions | undefined;
        if (isNumber(arg2)) {
            initialSize = arg2;
        } else {
            opts = arg2;
        }
        return new Pool<T, FinalArguments<T, Arguments>>(
            {
                ctor: () => new cls(),
                ...opts,
            },
            initialSize ?? 0,
        );
    }

    /**
     * 设计容量
     *
     * `-1` 表示不会限制池内可用对象数量，否则若池内对象数量超出设计容量则会释放多余的可用对象
     */
    capacity: number = 0;

    /**
     * 可用对象数量
     */
    availableCount: number = 0;

    private arr: (T | null)[] = [];
    private _ctor: () => T;
    private _reuse: Covariant<(item: T, ...args: Arguments) => void>;
    private _recycle: Covariant<(item: T) => void>;
    private _dispose: Covariant<(item: T) => void>;
    private _expansion: (size: number) => number;
    private get size() {
        return this.capacity === -1 ? this.arr.length : this.capacity;
    }

    protected constructor(
        handler: PoolHandler<T, Arguments>,
        initialSize: number,
    ) {
        this._ctor = handler.ctor.bind(handler);
        this._reuse = handler.reuse
            ? handler.reuse.bind(handler)
            : (item: Poolable, ...args: Arguments) => item[reuse]?.(...args);
        this._recycle = handler.recycle
            ? handler.recycle.bind(handler)
            : (item: Poolable) => item[recycle]?.();
        this._dispose = handler.dispose
            ? handler.dispose.bind(handler)
            : (item: Partial<Disposable>) => item[Symbol.dispose]?.();
        this._expansion = handler.expansion
            ? handler.expansion.bind(handler)
            : (size: number) => Math.max(8, size >> 1);
        this.capacity = handler.capacity ?? -1;
        this.fill(initialSize);
    }

    /**
     * 填充指定数量的新对象放入对象池
     *
     * 填充数量会受到设计容量的限制。
     *
     * @param num 数量，默认填满对象池
     */
    fill(num: number = this.size) {
        if (this.capacity !== -1) {
            num = Math.min(num, this.capacity - this.availableCount);
        }

        if (num <= 0) return;
        while (num-- > 0) {
            const item = this._ctor();
            this.arr[this.availableCount++] = item;
        }
    }

    /**
     * 调整对象池设计容量
     *
     * 若当前可用对象数量大于新设计容量，则会释放多余的可用对象。
     */
    resize(capacity: number) {
        this.capacity = capacity;
        if (this.capacity === -1) {
            return;
        }
        this.shrink(capacity);
    }

    /**
     * 获取对象
     *
     * @param args 参数
     */
    get(...args: Arguments): T {
        if (this.availableCount <= 0) {
            const num = this._expansion(this.size);
            if (this.capacity !== -1 && num > this.capacity) {
                this.capacity = num;
            }
            this.fill(num);
        }

        const item = this.arr[--this.availableCount]!;
        this.arr[this.availableCount] = null;
        this._reuse(item, ...args);

        return item;
    }

    /**
     * 获取对象句柄
     *
     * 通过该句柄的 {@link PoolItemHandle.object} 属性访问池对象，释放该句柄即会回收该对象。
     *
     * 注意：请持有句柄而不是对象本身。
     */
    acquire(...args: Arguments): PoolItemHandle<T> {
        const object = this.get(...args);
        return new PoolItemHandle(this, object);
    }

    /**
     * 返还对象
     *
     * @param item 池对象
     */
    put(item: T) {
        if (ROOKIE) {
            const index = this.arr.indexOf(item);
            if (index !== -1) {
                reportDuplicatePut();
                return;
            }
        }

        if (this.capacity !== -1 && this.availableCount >= this.capacity) {
            this._dispose(item);
            return;
        }

        this.arr[this.availableCount++] = item;
        this._recycle(item);
    }

    /**
     * 释放池内多余的对象以收缩对象池的大小到指定值
     *
     * 该方法不会调整设计容量。
     *
     * @param size 指定值
     * @returns 返回收缩后的对象池大小
     */
    shrink(size: number): number {
        while (this.availableCount > size) {
            const item = this.arr[--this.availableCount]!;
            this.arr[this.availableCount] = null;
            this._dispose(item);
        }
        this.arr.length = size;
        return size;
    }

    /**
     * 清空池内所有的对象
     */
    clear() {
        this.shrink(0);
    }

    /**
     * @inheritdoc
     */
    [Symbol.dispose]() {
        this.clear();
        this._ctor = undefined!;
        this._reuse = undefined!;
        this._recycle = undefined!;
        this._dispose = undefined!;
        this._expansion = undefined!;
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
