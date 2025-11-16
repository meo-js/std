import type { fn } from '../function.js';
import { Observable } from '../polyfill/observable.js';
import { isFunction, isObject } from '../predicate.js';
import type { checked, LiteralKeyOf } from '../ts.js';
import { Event } from './event.js';
import { EventListener } from './listener.js';

/**
 * {@link EventEmitter} 用于管理多个事件的监听与触发。
 */
export class EventEmitter<T extends EventMap = EventMap> {
  private _events = new Map<TypeOf<T>, Event<ArgumentsOf<T, TypeOf<T>>>>();
  private _residentEvents: object | undefined = undefined;
  private _unusedEventThreshold = 0;

  constructor(clearThreshold: number = 32) {
    this._unusedEventThreshold = clearThreshold;
  }

  /**
   * 添加监听器
   */
  addListener<Type extends TypeOf<T>>(
    type: Type,
    listener: EventListener<ArgumentsOf<T, Type>>,
  ) {
    const event = ensureEvent(this._events, type);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- checked.
    event.addListener(listener as EventListener);
  }

  /**
   * 移除监听器
   */
  removeListener<Type extends TypeOf<T>>(
    type: Type,
    listener: EventListener<ArgumentsOf<T, Type>>,
  ): void;
  removeListener<Type extends TypeOf<T>>(
    listener: EventListener<ArgumentsOf<T, Type>>,
  ): void;
  removeListener<Type extends TypeOf<T>>(
    arg1: Type | EventListener<ArgumentsOf<T, Type>>,
    arg2?: EventListener<ArgumentsOf<T, Type>>,
  ) {
    const map = this._events;
    const threshould = this._unusedEventThreshold;
    if (isObject(arg1)) {
      for (const [type, event] of map) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- checked.
        event.removeListener(arg1 as EventListener);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    } else {
      const type = arg1;
      const event = map.get(type);
      if (event != null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- checked.
        event.removeListener(arg2 as EventListener);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    }
  }

  /**
   * 移除所有监听器
   *
   * @param type 指定标识，默认移除所有监听器
   */
  removeAllListeners(type?: TypeOf<T>) {
    const map = this._events;
    if (type != null) {
      const event = map.get(type);
      if (event != null) {
        event.removeAllListeners();
        map.delete(type);
      }
    } else {
      for (const event of map.values()) {
        event.removeAllListeners();
      }
      map.clear();
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
  ): void;
  off<Type extends TypeOf<T>>(
    callback: CallbackOf<T, Type>,
    thisArg?: unknown,
  ): void;
  off<Type extends TypeOf<T>>(
    arg1: Type | CallbackOf<T, Type>,
    arg2?: unknown,
    arg3?: unknown,
  ) {
    const map = this._events;
    const threshould = this._unusedEventThreshold;
    if (isFunction(arg1)) {
      for (const [type, event] of map) {
        event.off(arg1 as fn, arg2);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    } else {
      const type = arg1;
      const event = map.get(type);
      if (event != null) {
        event.off(arg2 as fn, arg3);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    }
  }

  /**
   * 取消所有相同函数作用域的监听
   *
   * @param type 事件标识
   * @param thisArg 函数作用域
   */
  offThisArg<Type extends TypeOf<T>>(type: Type, thisArg: unknown): void;
  offThisArg<Type extends TypeOf<T>>(thisArg: unknown): void;
  offThisArg(arg1: unknown, arg2?: unknown) {
    const map = this._events;
    const threshould = this._unusedEventThreshold;
    if (arguments.length === 1) {
      const thisArg = arg1;
      for (const [type, event] of map) {
        event.offThisArg(thisArg);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    } else {
      const type = arg1 as TypeOf<T>;
      const thisArg = arg2;
      const event = map.get(type);
      if (event != null) {
        event.offThisArg(thisArg);
        if (event.listenerCount === 0 && map.size > threshould) {
          this._unusedEventThreshold = clearUnusedEvents(
            map,
            this._residentEvents,
            threshould,
          );
        }
      }
    }
  }

  /**
   * 取消所有监听
   *
   * @param type 指定事件标识，默认移除所有事件的所有监听
   */
  offAll(type?: TypeOf<T>) {
    this.removeAllListeners(type);
  }

  /**
   * 触发事件
   *
   * @param type 事件标识
   * @param args 事件参数
   */
  emit<Type extends TypeOf<T>>(type: Type, ...args: ArgumentsOf<T, Type>) {
    const map = this._events;
    const threshould = this._unusedEventThreshold;
    const event = map.get(type);
    if (event != null) {
      event.emit(...(args as checked));
      if (event.listenerCount === 0 && map.size > threshould) {
        this._unusedEventThreshold = clearUnusedEvents(
          map,
          this._residentEvents,
          threshould,
        );
      }
    }
  }

  /**
   * 返回指定事件的可观察对象
   *
   * @param type 事件标识
   */
  when<Type extends TypeOf<T>>(type: Type): Observable<ArgumentsOf<T, Type>> {
    return new Observable(subscriber => {
      if (subscriber.signal.aborted) return;

      const listener = new EventListener((...args: ArgumentsOf<T, Type>) => {
        subscriber.next(args);
      }, this);

      subscriber.signal.addEventListener(
        'abort',
        // @ts-expect-error -- removeListener(overload function) causes the number of parameters to be falsely reported.
        this.removeListener.bind(this, type, listener),
      );

      this.addListener(type, listener);
    });
  }

  /**
   * 返回指定事件的 {@link Event} 实例的对象
   */
  protected _assignEvents<const Types extends TypeOf<T>[]>(
    ...types: Types
  ): EventsOf<T, Types> {
    const map = this._events;
    return (this._residentEvents = Object.fromEntries(
      types.map(type => [type, ensureEvent(map, type)]),
    )) as EventsOf<T, Types>;
  }
}

/**
 * 事件声明
 */
export type EventMap = Record<PropertyKey, readonly unknown[]>;

/**
 * 获取 {@link T} 的所有事件标识
 */
export type TypeOf<T extends EventMap> = LiteralKeyOf<T>;

/**
 * 获取 {@link T} 中 {@link Type} 事件的参数类型
 */
export type ArgumentsOf<T extends EventMap, Type extends PropertyKey> = T[Type];

/**
 * 获取 {@link T} 中 {@link Type} 事件的回调类型
 */
export type CallbackOf<T extends EventMap, Type extends PropertyKey> = (
  ...args: ArgumentsOf<T, Type>
) => void;

/**
 * 获取多个事件的 {@link Event} 实例对象
 */
export type EventsOf<T extends EventMap, Types extends TypeOf<T>[]> = {
  [K in Types[number]]: Event<ArgumentsOf<T, K>>;
};

function ensureEvent<T extends EventMap, Type extends TypeOf<T>>(
  events: Map<TypeOf<T>, Event<ArgumentsOf<T, TypeOf<T>>>>,
  type: TypeOf<T>,
): Event<ArgumentsOf<T, Type>> {
  const map = events;
  let event = map.get(type);
  if (!event) {
    map.set(type, (event = new Event()));
  }
  return event as Event<ArgumentsOf<T, Type>>;
}

function clearUnusedEvents<T extends EventMap>(
  events: Map<TypeOf<T>, Event<ArgumentsOf<T, TypeOf<T>>>>,
  residentEvents: object | undefined,
  threadhold: number = 32,
) {
  // Strategy:
  // 0. Assume a cleaning threshold of 32 and perform one cleaning.
  // 1. If the remaining is more than half (16), double the threshold.
  // 2. If the remaining is less than 1/4 (8), halve the threshold, with a minimum of 16.
  const map = events;
  for (const [type, event] of map) {
    if (
      event.listenerCount === 0
      && (!residentEvents || !(type in residentEvents))
    ) {
      map.delete(type);
    }
  }
  const size = map.size;
  if (size > threadhold / 2) {
    threadhold *= 2;
  } else if (size < threadhold / 4) {
    threadhold = Math.max(threadhold / 2, 16);
  }
  return threadhold;
}
