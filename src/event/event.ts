/**
 * @public
 * @module
 */
import type { fn } from '../function.js';
import { SafeIterArray } from '../internal/safe-iter-array.js';
import { Observable } from '../polyfill/observable.js';
import { EventListener } from './listener.js';

let _callbackForRemove: unknown = null;
let _thisArgForRemove: unknown = null;

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
    const listeners = this.listeners;
    if (listeners == null) {
      return 0;
    } else if (listeners instanceof SafeIterArray) {
      return listeners.count;
    } else {
      return 1;
    }
  }

  private listeners:
    | null
    | EventListener<Arguments>
    | SafeIterArray<EventListener<Arguments>> = null;

  /**
   * 添加监听器
   */
  addListener(listener: EventListener<Arguments>) {
    const listeners = this.listeners;
    if (listeners == null) {
      this.listeners = listener;
    } else if (listeners instanceof SafeIterArray) {
      listeners.push(listener);
    } else {
      this.listeners = new SafeIterArray<EventListener<Arguments>>();
      this.listeners.push(listeners);
      this.listeners.push(listener);
    }
  }

  /**
   * 移除监听器
   */
  removeListener(listener: EventListener<Arguments>) {
    const listeners = this.listeners;
    if (listeners instanceof SafeIterArray) {
      return listeners.remove(listener);
    } else {
      if (listeners === listener) {
        this.listeners = null;
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    const listeners = this.listeners;
    if (listeners instanceof SafeIterArray) {
      listeners.clear();
    } else {
      this.listeners = null;
    }
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
    if (listeners instanceof SafeIterArray) {
      _callbackForRemove = callback;
      _thisArgForRemove = thisArg;
      listeners.forEach(remove);
    } else {
      if (
        listeners
        && listeners.callback === callback
        // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
        && listeners.thisArg == thisArg
      ) {
        this.listeners = null;
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
    if (listeners instanceof SafeIterArray) {
      listeners.forEach(removeByThisArg, thisArg);
    } else {
      // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
      if (listeners?.thisArg == thisArg) {
        this.listeners = null;
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
    const listeners = this.listeners;

    if (listeners instanceof SafeIterArray) {
      listeners.forEach(call, args);
    } else if (listeners) {
      if (listeners.once) {
        this.listeners = null;
      }
      listeners.call(args);
    }
  }

  /**
   * 返回该事件的可观察对象
   */
  when(): Observable<Arguments> {
    return new Observable(subscriber => {
      if (subscriber.signal.aborted) return;

      const listener = (...args: Arguments) => {
        subscriber.next(args);
      };

      subscriber.signal.addEventListener(
        'abort',
        this.off.bind(this, listener),
      );

      this.on(listener);
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

function call<Arguments extends readonly unknown[]>(
  this: Arguments,
  listener: EventListener,
  index: number,
  array: SafeIterArray<EventListener<Arguments>>,
) {
  if (listener.once) {
    array.removeAt(index);
  }
  listener.call(this);
}

function remove<Arguments extends readonly unknown[]>(
  this: void,
  listener: EventListener,
  index: number,
  array: SafeIterArray<EventListener<Arguments>>,
) {
  if (
    listener.callback === _callbackForRemove
    // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
    && listener.thisArg == _thisArgForRemove
  ) {
    array.removeAt(index);
    return false;
  } else {
    return true;
  }
}

function removeByThisArg<Arguments extends readonly unknown[]>(
  this: unknown,
  listener: EventListener,
  index: number,
  array: SafeIterArray<EventListener<Arguments>>,
) {
  // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
  if (listener.thisArg == this) {
    array.removeAt(index);
  }
}
