import type { fn } from '../function.js';
import { Observable } from '../polyfill/observable.js';
import type { IsUnknown } from '../predicate.js';
import type { checked, unreachable } from '../ts.js';
import type { If } from '../ts/logical.js';
import { Event } from './event.js';
import { EventListener } from './listener.js';

/**
 * {@link EventEmitter} 用于管理多个事件的监听与触发。
 */
export class EventEmitter<T extends EventMap = EventMap> {
  /**
   * 关闭严格类型检查
   */
  readonly unsafe = this as unknown as EventEmitter;

  private listeners = new Map<TypeOf<T>, Event<ArgumentsOf<T, TypeOf<T>>>>();

  /**
   * 添加监听器
   */
  addListener<Type extends TypeOf<T>>(
    type: Type,
    listener: EventListener<ArgumentsOf<T, Type>>,
  ) {
    const event = this.obtainEvent(type);
    event.addListener(listener as checked);
  }

  /**
   * 移除监听器
   */
  removeListener<Type extends TypeOf<T>>(
    type: Type,
    listener: EventListener<ArgumentsOf<T, Type>>,
  ) {
    const event = this.getEvent(type);
    if (event) {
      const result = event.removeListener(listener as checked);

      if (event.listenerCount === 0) {
        this.deleteEvent(type);
      }

      return result;
    } else {
      return false;
    }
  }

  /**
   * 移除所有指定监听器
   *
   * @param listener 指定监听器，默认移除所有监听器
   */
  removeAllByListener(listener: EventListener<ArgumentsOf<T, TypeOf<T>>>) {
    for (const [type, event] of this.listeners) {
      this.removeListenerFromEvent(type, event, listener);
    }
  }

  /**
   * 移除所有监听器
   *
   * @param eventType 指定标识，默认移除所有监听器
   */
  removeAllListeners(eventType?: TypeOf<T>) {
    if (eventType != null) {
      const event = this.getEvent(eventType);
      if (event) {
        event.removeAllListeners();
        this.deleteEvent(eventType);
      }
    } else {
      for (const event of this.listeners.values()) {
        event.removeAllListeners();
      }

      this.listeners.clear();
    }
  }

  /**
   * 监听事件
   *
   * @param type 事件标识
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  on<Type extends TypeOf<T>>(
    type: Type,
    callback: CallbackOf<T, Type>,
    thisArg?: unknown,
  ) {
    this.addListener(type, new EventListener(callback, thisArg, false));
  }

  /**
   * 一次性监听事件
   *
   * @param type 事件标识
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  once<Type extends TypeOf<T>>(type: Type): Promise<ArgumentsOf<T, Type>>;
  once<Type extends TypeOf<T>>(
    type: Type,
    callback: CallbackOf<T, Type>,
    thisArg?: unknown,
  ): void;
  once<Type extends TypeOf<T>>(
    type: Type,
    callback?: CallbackOf<T, Type>,
    thisArg?: unknown,
  ): void | Promise<ArgumentsOf<T, Type>> {
    if (callback) {
      this.addListener(type, new EventListener(callback, thisArg, true));
    } else {
      return new Promise(resolve => {
        this.once(type, (...args) => {
          resolve(args);
        });
      });
    }
  }

  /**
   * 取消监听
   *
   * @param type 事件标识
   * @param callback 事件回调函数
   * @param thisArg 函数作用域
   */
  off<Type extends TypeOf<T>>(
    type: Type,
    callback: CallbackOf<T, Type>,
    thisArg?: unknown,
  ) {
    const event = this.getEvent(type);
    if (event) {
      event.off(callback, thisArg);

      if (event.listenerCount === 0) {
        this.deleteEvent(type);
      }
    }
  }

  /**
   * 取消所有相同函数作用域的监听
   *
   * @param type 事件标识
   * @param thisArg 函数作用域
   */
  offThisArg<Type extends TypeOf<T>>(type: Type, thisArg: unknown) {
    const event = this.getEvent(type);
    if (event) {
      event.offThisArg(thisArg);

      if (event.listenerCount === 0) {
        this.deleteEvent(type);
      }
    }
  }

  /**
   * 移除所有相同回调函数的监听
   *
   * @param callback 回调函数
   * @param thisArg 函数作用域
   */
  offAllBy(callback: CallbackOf<T, TypeOf<T>>, thisArg?: unknown) {
    for (const [type, event] of this.listeners) {
      event.off(callback as fn<ArgumentsOf<T, TypeOf<T>>>, thisArg);

      if (event.listenerCount === 0) {
        this.deleteEvent(type);
      }
    }
  }

  /**
   * 移除所有相同函数作用域的监听
   *
   * @param thisArg 函数作用域
   */
  offAllByThisArg(thisArg: unknown) {
    for (const [type, event] of this.listeners) {
      event.offThisArg(thisArg);

      if (event.listenerCount === 0) {
        this.deleteEvent(type);
      }
    }
  }

  /**
   * 取消所有监听
   *
   * @param eventType 指定事件标识，默认移除所有事件的所有监听
   */
  offAll(eventType?: TypeOf<T>) {
    this.removeAllListeners(eventType);
  }

  /**
   * 触发事件
   *
   * @param type 事件标识
   * @param args 事件参数
   */
  emit<Type extends TypeOf<T>>(type: Type, ...args: ArgumentsOf<T, Type>) {
    const event = this.getEvent(type);
    if (event) {
      event.emit(...args);
    }
  }

  /**
   * 返回指定事件的可观察对象
   *
   * @param type 事件标识
   */
  when<Type extends TypeOf<T>>(type: Type): Observable<ArgumentsOf<T, Type>> {
    const event = this.obtainEvent(type);
    return event.when();
  }

  private getEvent<Type extends TypeOf<T>>(
    type: Type,
  ): Event<ArgumentsOf<T, Type>> | undefined {
    return this.listeners.get(type) as checked;
  }

  private obtainEvent<Type extends TypeOf<T>>(
    type: Type,
  ): Event<ArgumentsOf<T, Type>> {
    let event = this.listeners.get(type);
    if (event == null) {
      event = new Event<ArgumentsOf<T, TypeOf<T>>>();
      this.listeners.set(type, event);
    }
    return event as checked;
  }

  private deleteEvent<Type extends TypeOf<T>>(type: Type) {
    this.listeners.delete(type);
  }

  private removeListenerFromEvent(
    type: TypeOf<T>,
    event: Event<ArgumentsOf<T, TypeOf<T>>>,
    listener: EventListener<ArgumentsOf<T, TypeOf<T>>>,
  ) {
    const result = event.removeListener(listener as checked);

    if (event.listenerCount === 0) {
      this.deleteEvent(type);
    }

    return result;
  }
}

/**
 * 事件声明
 */
export type EventMap = Record<PropertyKey, readonly unknown[]>;

/**
 * 获取 {@link T} 的所有事件标识
 */
export type TypeOf<T extends EventMap> = keyof T;

/**
 * 获取 {@link T} 中 {@link Type} 事件的参数类型
 */
export type ArgumentsOf<T extends EventMap, Type extends PropertyKey> = (
  T extends Record<Type, infer V> ? V : readonly unknown[]
) extends infer V
  ? // 奇怪不知为何 keyof T 是 unknown
    If<IsUnknown<V>, unknown[], V>
  : unreachable;

/**
 * 获取 {@link T} 中 {@link Type} 事件的回调类型
 */
export type CallbackOf<T extends EventMap, Type extends PropertyKey> = (
  ...args: ArgumentsOf<T, Type>
) => void;

const e = new EventEmitter();

e.emit('key');
e.on('type', () => {
  // test.
});
