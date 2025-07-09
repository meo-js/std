/**
 * 可安全遍历数组
 */
export class SafeIterArray<T> implements Iterable<T> {
    /**
     * @internal
     */
    arr: (T | undefined)[];
    private lockerCount = 0;
    private dirty: boolean = false;

    /**
     * 是否已锁定
     */
    get locked() {
        return this.lockerCount > 0;
    }

    /**
     * 长度
     *
     * 注意：无法在遍历中设置长度
     */
    get length() {
        return this.arr.length;
    }
    set length(value: number) {
        if (!this.locked) {
            this.arr.length = value;
        }
    }

    constructor(arrayLength?: number) {
        this.arr = new Array<T | undefined>(arrayLength ?? 0);
    }

    /**
     * 锁定数组，返回是否为根级锁定
     */
    lock() {
        this.lockerCount++;
        return this.lockerCount === 1;
    }

    /**
     * 解锁数组
     */
    unlock() {
        this.lockerCount--;
        if (this.lockerCount === 0) {
            if (this.dirty) {
                this.clearInvalidValues();
            }
        }
    }

    /**
     * 获取指定下标元素
     */
    at(index: number) {
        return this.arr.at(index);
    }

    /**
     * {@link Array.push}
     */
    push(...items: T[]) {
        return this.arr.push(...items);
    }

    /**
     * 插入到数组指定位置
     *
     * 注意：无法在遍历中调用
     *
     * @param v 元素
     * @param index 下标
     */
    insert(v: T, index: number) {
        if (this.locked) {
            return false;
        }
        this.arr.splice(index, 0, v);
        return true;
    }

    /**
     * 移除数组元素
     *
     * @param v 元素
     */
    remove(v: T) {
        const i = this.arr.indexOf(v);
        if (i !== -1) {
            this.locked ? this.delayRemove(i) : this.immedRemove(i);
            return true;
        } else {
            return false;
        }
    }

    /**
     * 移除指定下标元素
     *
     * @param index 数组下标
     */
    removeAt(index: number) {
        if (index >= 0 && index < this.arr.length) {
            this.locked ? this.delayRemove(index) : this.immedRemove(index);
        }
    }

    /**
     * 清空数组
     */
    clear() {
        if (this.locked) {
            this.arr.fill(undefined);
            this.dirty = true;
        } else {
            this.arr.length = 0;
        }
    }

    private delayRemove(i: number) {
        this.arr[i] = undefined;
        this.dirty = true;
    }

    private immedRemove(i: number) {
        this.arr.splice(i, 1);
    }

    private clearInvalidValues() {
        if (!this.locked) {
            this.dirty = false;
            const list = this.arr;
            let emptyIndex = -1;

            for (let i = 0; i < list.length; i++) {
                if (list[i] !== undefined) {
                    if (emptyIndex !== -1) {
                        list[emptyIndex] = list[i];
                        list[i] = undefined;
                        emptyIndex++;
                    }
                } else {
                    if (emptyIndex === -1) {
                        emptyIndex = i;
                    }
                }
            }

            if (emptyIndex !== -1) {
                list.length = emptyIndex;
            }
        }
    }

    /**
     * 遍历数组，为每个元素调用一次回调函数
     */
    forEach(
        callback: (
            value: T,
            index: number,
            array: SafeIterArray<T>,
        ) => void | boolean,
        thisArg?: unknown,
    ) {
        const array = this.arr;
        const len = array.length;

        this.lock();

        try {
            for (let i = 0; i < len; i++) {
                const value = array[i];
                if (value !== undefined) {
                    const cond = callback.call(thisArg, value, i, this);
                    if (cond === false) {
                        break;
                    }
                }
            }
        } finally {
            this.unlock();
        }
    }

    /**
     * @inheritdoc
     */
    [Symbol.iterator]() {
        return new SafeIterator(this);
    }
}

class SafeIterator<T> extends Iterator<T, BuiltinIteratorReturn, unknown> {
    private array: SafeIterArray<T>;
    private len: number;
    private i = 0;

    constructor(array: SafeIterArray<T>) {
        super();
        this.array = array;
        this.len = array.length;
        this.array.lock();
    }

    next(): IteratorResult<T, BuiltinIteratorReturn> {
        const { len, array } = this;

        while (this.i < len) {
            const value = array.arr[this.i++];
            if (value !== undefined) {
                return {
                    value,
                    done: false,
                };
            }
        }

        array.unlock();

        return {
            value: undefined,
            done: true,
        };
    }

    override return(): IteratorResult<T, BuiltinIteratorReturn> {
        this.i = this.len;
        this.array.unlock();
        return {
            value: undefined,
            done: true,
        };
    }

    override throw(e?: unknown): IteratorResult<T, undefined> {
        return this.return();
    }
}
