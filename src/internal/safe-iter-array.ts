/**
 * 可安全遍历数组
 */
export class SafeIterArray<T> implements Iterable<T> {
  /**
   * @internal
   */
  items: (T | undefined)[];

  /**
   * 是否已锁定
   */
  get locked() {
    return this.lockerCount > 0;
  }

  /**
   * 内部存储长度
   *
   * 注意：无法在遍历中设置长度
   */
  get length() {
    return this.items.length;
  }
  set length(value: number) {
    if (!this.locked) {
      this.items.length = value;
    }
  }

  /**
   * 有效元素数量
   */
  get count() {
    if (this.dirty) {
      const items = this.items;
      let count = 0;
      for (let index = 0; index < items.length; index++) {
        if (items[index] !== undefined) {
          count++;
        }
      }
      return count;
    } else {
      return this.items.length;
    }
  }

  /**
   * 是否有未清除的无效值
   */
  get dirty(): boolean {
    return (this.state & 1) === 0;
  }
  private set dirty(value: boolean) {
    this.state = value ? this.state & 0xfffffffe : this.state | 1;
  }

  private get lockerCount(): number {
    return this.state >>> 1;
  }
  private set lockerCount(v: number) {
    this.state = ((v & 0x7fffffff) << 1) | (this.state & 1);
  }

  /**
   * Internal packed state:
   *
   * - Bit 0 for {@link dirty}, `0` means true.
   * - Bits 1..31 for {@link lockerCount}.
   */
  private state = 1;

  constructor(arrayLength?: number) {
    this.items = new Array<T | undefined>(arrayLength ?? 0);
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
    // `state` 0 means that `dirty` is true and `lockerCount` is 0.
    if (this.state === 0) {
      this.clearInvalidValues();
    }
  }

  /**
   * 获取指定下标元素
   */
  at(index: number) {
    return this.items.at(index);
  }

  /**
   * {@link Array.push}
   */
  push(...items: T[]) {
    return this.items.push(...items);
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
    this.items.splice(index, 0, v);
    return true;
  }

  /**
   * 移除数组元素
   *
   * @param v 元素
   */
  remove(v: T) {
    const i = this.items.indexOf(v);
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
    if (index >= 0 && index < this.items.length) {
      this.locked ? this.delayRemove(index) : this.immedRemove(index);
    }
  }

  private delayRemove(i: number) {
    this.items[i] = undefined;
    this.dirty = true;
  }

  private immedRemove(i: number) {
    this.items.splice(i, 1);
  }

  private clearInvalidValues() {
    if (!this.locked) {
      this.dirty = false;
      const items = this.items;
      let emptyIndex = -1;

      for (let i = 0; i < items.length; i++) {
        if (items[i] !== undefined) {
          if (emptyIndex !== -1) {
            items[emptyIndex] = items[i];
            items[i] = undefined;
            emptyIndex++;
          }
        } else {
          if (emptyIndex === -1) {
            emptyIndex = i;
          }
        }
      }

      if (emptyIndex !== -1) {
        items.length = emptyIndex;
      }
    }
  }

  /**
   * 清空数组
   */
  clear() {
    if (this.locked) {
      this.items.fill(undefined);
      this.dirty = true;
    } else {
      this.items.length = 0;
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
    const items = this.items;
    const len = items.length;

    this.lock();

    try {
      for (let i = 0; i < len; i++) {
        const value = items[i];
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
      const value = array.items[this.i++];
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
}

// another unordered implementation idea:
// in loop, len is keep, so add is ok.
// [a, b, c, d, e, f, g]
//  |
// if remove self(a), we can switch with last(g), and pop.
// [a, b, c, d, e, f, g]
//        |
// if remove a, we can put c to a, and put g to c, and pop.
// the i and len need sync this change, so it should be class var.
// in comparison to the current implementation:
// 1. there is no need to judge whether the value is valid.
// 2. there is no need to clean up invalid data afterward.
// 3. recursive calls are not allowed.
// does recursive call activate the call stack?
// TODO
// version
// listener { callback, thisArg } or callback
// listener state { once, version }
