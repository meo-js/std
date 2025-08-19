import { recycle, reuse } from '../protocol/symbols.js';

/**
 * 对象池选项
 */
export interface PoolOptions {
  /**
   * 对象池补充与扩容函数
   *
   * 当对象池为空时会回调该函数以决定补充或者扩容。
   *
   * 对象池将补充该函数返回数值相应数量的新对象，若该数值大于当前设计容量，还会将设计容量调整为该数值。
   *
   * 若不提供该函数，默认会按指数增长扩容。
   *
   * @param size 若 {@link capacity} 为 `-1` 则为对象池内部数组的长度，否则为当前设计容量
   */
  expansion?(size: number): number;

  /**
   * 设计容量
   *
   * `-1` 则代表着不会限制池内可用对象数量，否则若池内对象数量超出设计容量则会释放多余的可用对象
   *
   * @default -1
   */
  capacity?: number;
}

/**
 * 简单对象池处理器
 */
export interface PlainPoolHandler<out T> extends Base<T> {}

/**
 * 对象池处理器
 */
export interface PoolHandler<out T, in Arguments extends readonly unknown[]>
  extends Base<T>,
    Reuse<T, Arguments>,
    PoolOptions {}

interface Base<out T> {
  /**
   * 用于创建新对象的构造函数
   */
  ctor(): T;

  /**
   * 释放池对象时回调该函数
   *
   * 若不提供该函数，默认会尝试调用对象上的 {@link Symbol.dispose} 方法
   */
  dispose?(item: T): void;
}

interface Reuse<out T, in Arguments extends readonly unknown[]> {
  /**
   * 复用池对象时回调该函数
   *
   * 若不提供该函数，默认会尝试调用对象上的 {@link reuse Symbol.reuse} 方法
   *
   * @param item 池对象
   */
  reuse?(item: T, ...args: Arguments): void;

  /**
   * 回收池对象时回调该函数
   *
   * 若不提供该函数，默认会尝试调用对象上的 {@link recycle Symbol.recycle} 方法
   *
   * @param item 池对象
   */
  recycle?(item: T): void;
}
