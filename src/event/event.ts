import type { fn } from '../function.js';
import { Observable } from '../polyfill/observable.js';
import { EventListener } from './listener.js';
import {
  addListener,
  emit,
  getListenerCount,
  type InternalStore,
  off,
  offThisArg,
  removeAllListeners,
  removeListener,
} from './shared.js';

/**
 * {@link Event} 用于管理单一事件的监听与触发。
 */
export class Event<Arguments extends readonly unknown[] = []>
  implements PromiseLike<Arguments>
{
  /**
   * 当前监听器数量
   */
  get listenerCount() {
    return getListenerCount(this.listeners);
  }

  private listeners: InternalStore<Arguments> | null = null;

  /**
   * 添加监听器
   */
  addListener(listener: EventListener<Arguments>) {
    this.listeners = addListener(this.listeners, listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener: EventListener<Arguments>) {
    this.listeners = removeListener(this.listeners, listener);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    this.listeners = removeAllListeners(this.listeners);
  }

  /**
   * 监听事件
   *
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  on(callback: fn<Arguments>, thisArg?: unknown) {
    this.addListener(new EventListener(callback, thisArg, false));
  }

  /**
   * 一次性监听事件
   *
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  once(): Promise<Arguments>;
  once(callback: fn<Arguments>, thisArg?: unknown): void;
  once(callback?: fn<Arguments>, thisArg?: unknown): void | Promise<Arguments> {
    if (callback) {
      this.addListener(new EventListener(callback, thisArg, true));
    } else {
      return new Promise((resolve, reject) => {
        this.once((...args) => {
          resolve(args);
        });
      });
    }
  }

  /**
   * 取消监听
   *
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  off(callback: fn<Arguments>, thisArg?: unknown) {
    this.listeners = off(this.listeners, callback, thisArg);
  }

  /**
   * 取消所有相同函数作用域的监听
   *
   * @param thisArg 函数作用域
   */
  offThisArg(thisArg: unknown) {
    this.listeners = offThisArg(this.listeners, thisArg);
  }

  /**
   * 取消所有监听
   */
  offAll() {
    this.removeAllListeners();
  }

  /**
   * 触发事件
   *
   * @param args 事件参数
   */
  emit(...args: Arguments) {
    this.listeners = emit(this.listeners, args);
  }

  /**
   * 返回该事件的可观察对象
   */
  when(): Observable<Arguments> {
    return new Observable(subscriber => {
      if (subscriber.signal.aborted) return;

      const listener = new EventListener((...args: Arguments) => {
        subscriber.next(args);
      }, this);

      subscriber.signal.addEventListener(
        'abort',
        this.removeListener.bind(this, listener),
      );

      this.addListener(listener);
    });
  }

  /**
   * @inheritdoc
   */
  async then<TResult1 = Arguments, TResult2 = never>(
    onfulfilled?:
      | ((value: Arguments) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return new Promise((resolve, reject) => {
      this.once((...args) => {
        resolve(
          onfulfilled ? onfulfilled(args) : (args as unknown as TResult1),
        );
      });
    });
  }
}
