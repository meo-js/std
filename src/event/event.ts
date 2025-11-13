import { removeAtBySwap } from '../array.js';
import { noop, type fn } from '../function.js';
import { Observable } from '../polyfill/observable.js';
import { isArray } from '../predicate.js';
import type { checked, uncertain } from '../ts.js';
import { EventListener } from './listener.js';

const INVALID_LISTENER = new EventListener<uncertain>(noop, {}, true);

/**
 * {@link Event} 用于管理单一事件的监听与触发。
 */
export class Event<Arguments extends readonly unknown[] = []>
  implements PromiseLike<Arguments>
{
  /**
   * 监听器数量。
   */
  listenerCount: number = 0;

  private listeners:
    | EventListener<Arguments>
    | EventListener<Arguments>[]
    | null = null;
  private lockCount = 0;

  /**
   * 添加监听器
   */
  addListener(listener: EventListener<Arguments>) {
    const listeners = this.listeners;
    if (listeners == null) {
      this.listeners = listener;
    } else if (isArray(listeners)) {
      listeners.push(listener);
    } else {
      this.listeners = [listeners, listener];
    }
    this.listenerCount++;
  }

  /**
   * 移除监听器
   */
  removeListener(listener: EventListener<Arguments>) {
    const listeners = this.listeners;
    if (listeners === listener) {
      this.listeners = null;
      this.listenerCount = 0;
    } else if (isArray(listeners)) {
      const i = listeners.indexOf(listener);
      if (i !== -1) {
        this.removeAt(i);
      }
    }
  }

  private removeAt(index: number) {
    if (this.lockCount > 0) {
      (<EventListener[]>this.listeners)[index] = INVALID_LISTENER;
    } else {
      removeAtBySwap(<EventListener[]>this.listeners, index);
    }
    this.listenerCount--;
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    const listeners = this.listeners;
    if (isArray(listeners)) {
      if (this.lockCount > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- checked.
        listeners.fill(INVALID_LISTENER);
      } else {
        listeners.length = 0;
      }
    } else {
      this.listeners = null;
    }
    this.listenerCount = 0;
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
    const listeners = this.listeners;
    if (isArray(listeners)) {
      const len = listeners.length;
      for (let i = 0; i < len; i++) {
        const listener = listeners[i];
        if (
          listener.callback === callback
          // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
          && listener.thisArg == thisArg
        ) {
          this.removeAt(i);
          return;
        }
      }
    } else {
      if (
        listeners
        && listeners.callback === callback
        // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
        && listeners.thisArg == thisArg
      ) {
        this.listeners = null;
        this.listenerCount = 0;
      }
    }
  }

  /**
   * 取消所有相同函数作用域的监听
   *
   * @param thisArg 函数作用域
   */
  offThisArg(thisArg: unknown) {
    const listeners = this.listeners;
    if (isArray(listeners)) {
      const unlock = this.lockCount === 0;
      let len = listeners.length;
      for (let i = 0; i < len; i++) {
        const listener = listeners[i];
        if (
          // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
          listener.thisArg == thisArg
        ) {
          this.removeAt(i);
          if (unlock) {
            i--;
            len--;
          }
        }
      }
    } else {
      if (
        listeners
        // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
        && listeners.thisArg == thisArg
      ) {
        this.listeners = null;
        this.listenerCount = 0;
      }
    }
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
    if (this.listenerCount === 0) return;
    const listeners = this.listeners!;
    if (isArray(listeners)) {
      const root = this.lockCount === 0;
      let len = listeners.length;
      this.lockCount++;

      for (let i = 0; i < len; i++) {
        const listener = listeners[i];
        if (listener.once) {
          const canRemove = root && this.lockCount === 1;
          if (listener === INVALID_LISTENER) {
            if (canRemove) {
              len--;
              listeners[i] = listeners[len];
              listeners.length = len;
              i--;
            }
            continue;
          } else {
            if (canRemove) {
              len--;
              listeners[i] = listeners[len];
              listeners.length = len;
              i--;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- checked.
              listeners[i] = INVALID_LISTENER;
            }
            this.listenerCount--;
          }
        }
        try {
          listener.callback.apply(listener.thisArg, args as checked);
        } catch (err) {
          reportError(err);
        }
      }

      this.lockCount--;

      if (
        root
        && this.listenerCount !== (<EventListener[]>this.listeners).length
      ) {
        this.cleanInvalidListeners();
      }
    } else {
      if (listeners.once) {
        this.listeners = null;
        this.listenerCount = 0;
      }
      try {
        listeners.callback.apply(listeners.thisArg, args as checked);
      } catch (err) {
        reportError(err);
      }
    }
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

  private cleanInvalidListeners() {
    const listeners = this.listeners;
    if (isArray(listeners)) {
      let len = listeners.length;
      for (let i = 0; i < len; i++) {
        if (listeners[i] === INVALID_LISTENER) {
          len--;
          listeners[i] = listeners[len];
          i--;
        }
      }
      listeners.length = len;
    }
  }
}
