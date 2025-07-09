/**
 * @public
 *
 * @module
 */
import type { fn } from "../function.js";
import { SafeIterArray } from "../internal/safe-iter-array.js";
import { Observable } from "../polyfill/observable.js";
import { EventListener } from "./listener.js";

/**
 * 事件类
 */
export class Event<Arguments extends readonly unknown[] = []>
    implements PromiseLike<Arguments>
{
    private listeners = new SafeIterArray<EventListener<Arguments>>();

    /**
     * 添加监听器
     */
    addListener(listener: EventListener<Arguments>) {
        this.listeners.push(listener);
    }

    /**
     * 移除监听器
     */
    removeListener(listener: EventListener<Arguments>) {
        return this.listeners.remove(listener);
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
    once(callback: fn<Arguments>, thisArg?: unknown) {
        this.addListener(new EventListener(callback, thisArg, true));
    }

    /**
     * 取消监听
     *
     * @param callback 事件回调函数
     * @param thisArg 函数作用域
     */
    off(callback: fn<Arguments>, thisArg?: unknown) {
        _callbackForRemove = callback;
        _thisArgForRemove = thisArg;
        this.listeners.forEach(remove);
    }

    /**
     * 取消所有相同函数作用域的监听
     *
     * @param thisArg 函数作用域
     */
    offThisArg(thisArg: unknown) {
        this.listeners.forEach(removeByThisArg, thisArg);
    }

    /**
     * 取消所有监听
     */
    offAll() {
        this.listeners.clear();
    }

    /**
     * 触发事件
     *
     * @param args 事件参数
     */
    emit(...args: Arguments) {
        this.listeners.forEach(call, args);
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
                "abort",
                this.off.bind(this, listener),
            );

            this.on(listener);
        });
    }

    /**
     * @inheritdoc
     */
    then<TResult1 = Arguments, TResult2 = never>(
        onfulfilled?:
            | ((value: Arguments) => TResult1 | PromiseLike<TResult1>)
            | null,
        onrejected?:
            | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
            | null,
    ): PromiseLike<TResult1 | TResult2> {
        return new Promise((resolve, reject) => {
            this.once((...args) => {
                resolve(
                    onfulfilled
                        ? onfulfilled(args)
                        : (args as unknown as TResult1),
                );
            });
        });
    }
}

let _callbackForRemove: unknown = null;
let _thisArgForRemove: unknown = null;

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
