import type { fn } from '../function.js';
import { Observable } from '../polyfill/observable.js';
import { isFunction, isObject } from '../predicate.js';
import type { LiteralKeyOf } from '../ts.js';
import { EventListener } from './listener.js';
import {
  type InternalStore,
  addListener,
  emit,
  isStrictEmpty,
  off,
  offThisArg,
  removeAllListeners,
  removeListener,
} from './shared.js';

/**
 * {@link EventEmitter} 用于管理多个事件的监听与触发。
 */
export class EventEmitter<T extends EventMap = EventMap> {
  private _eventListeners = new Map<
    TypeOf<T>,
    InternalStore<ArgumentsOf<T, TypeOf<T>>>
  >();

  /**
   * 添加监听器
   */
  addListener<Type extends TypeOf<T>>(
    type: Type,
    listener: EventListener<ArgumentsOf<T, Type>>,
  ) {
    const map = this._eventListeners;
    const store = map.get(type);
    const newStore = addListener(store, listener as EventListener);
    // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
    if (store != newStore) {
      map.set(type, newStore);
    }
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
    const map = this._eventListeners;
    if (isObject(arg1)) {
      for (const [type, store] of map) {
        const newStore = removeListener(store, arg1 as EventListener);
        updelStore(type, map, store, newStore);
      }
    } else {
      const type = arg1;
      const store = map.get(type);
      if (store != null) {
        const newStore = removeListener(store, arg2 as EventListener);
        updelStore(type, map, store, newStore);
      }
    }
  }

  /**
   * 移除所有监听器
   *
   * @param type 指定标识，默认移除所有监听器
   */
  removeAllListeners(type?: TypeOf<T>) {
    const map = this._eventListeners;
    if (type != null) {
      const store = map.get(type);
      if (store != null) {
        removeAllListeners(store);
        map.delete(type);
      }
    } else {
      for (const store of map.values()) {
        removeAllListeners(store);
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
    const map = this._eventListeners;
    if (isFunction(arg1)) {
      for (const [type, store] of map) {
        const newStore = off(store, arg1 as fn, arg2);
        updelStore(type, map, store, newStore);
      }
    } else {
      const type = arg1;
      const store = map.get(type);
      if (store != null) {
        const newStore = off(store, arg2 as fn, arg3);
        updelStore(type, map, store, newStore);
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
    const map = this._eventListeners;
    if (arguments.length === 1) {
      const thisArg = arg1;
      for (const [type, store] of map) {
        const newStore = offThisArg(store, thisArg);
        updelStore(type, map, store, newStore);
      }
    } else {
      const type = arg1 as TypeOf<T>;
      const thisArg = arg2;
      const store = map.get(type);
      if (store != null) {
        const newStore = offThisArg(store, thisArg);
        updelStore(type, map, store, newStore);
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
    const map = this._eventListeners;
    const store = map.get(type);
    if (store != null) {
      const newStore = emit(store, args as ArgumentsOf<T, TypeOf<T>>);
      updelStore(type, map, store, newStore);
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

function updelStore<T extends EventMap>(
  type: TypeOf<T>,
  map: Map<TypeOf<T>, InternalStore<ArgumentsOf<T, TypeOf<T>>>>,
  store: InternalStore<ArgumentsOf<T, TypeOf<T>>>,
  newStore: InternalStore<ArgumentsOf<T, TypeOf<T>>> | null,
) {
  if (isStrictEmpty(store)) {
    map.delete(type);
  } else {
    // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
    if (store != newStore) {
      map.set(type, newStore!);
    }
  }
}
