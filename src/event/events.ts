import type { fn } from "../function.js";
import { Observable } from "../polyfill/observable.js";
import type { IsUnknown } from "../predicate.js";
import type { checked, uncertain } from "../ts.js";
import type { If } from "../ts/logical.js";
import { Event } from "./event.js";
import { EventListener } from "./listener.js";

/**
 * 多事件类
 */
export class Events<T extends EventMap = EventMap> {
    /**
     * 关闭严格类型检查
     */
    readonly unsafe = this as unknown as Events;

    private map = new Map<TagOf<T>, Event<ArgumentsOf<T, TagOf<T>>>>();
    private autoClean: boolean;

    constructor(autoClean: boolean = false) {
        this.autoClean = autoClean;
    }

    private getEvent<Tag extends TagOf<T>>(
        tag: Tag,
    ): Event<ArgumentsOf<T, Tag>> | undefined {
        return this.map.get(tag) as checked;
    }

    private obtainEvent<Tag extends TagOf<T>>(
        tag: Tag,
    ): Event<ArgumentsOf<T, Tag>> {
        let event = this.map.get(tag);
        if (event == null) {
            event = new Event<ArgumentsOf<T, TagOf<T>>>();
            this.map.set(tag, event);
        }
        return event as checked;
    }

    private deleteEvent<Tag extends TagOf<T>>(tag: Tag) {
        this.map.delete(tag);
    }

    private removeListenerFromEvent(
        tag: TagOf<T>,
        event: Event<ArgumentsOf<T, TagOf<T>>>,
        listener: EventListener<ArgumentsOf<T, TagOf<T>>>,
    ) {
        const result = event.removeListener(listener as checked);

        if (this.autoClean && event.listenerCount === 0) {
            this.deleteEvent(tag);
        }

        return result;
    }

    /**
     * 添加监听器
     */
    addListener<Tag extends TagOf<T>>(
        tag: Tag,
        listener: EventListener<ArgumentsOf<T, Tag>>,
    ) {
        const event = this.obtainEvent(tag);
        event.addListener(listener as checked);
    }

    /**
     * 移除监听器
     */
    removeListener<Tag extends TagOf<T>>(
        tag: Tag,
        listener: EventListener<ArgumentsOf<T, Tag>>,
    ) {
        const event = this.getEvent(tag);
        if (event) {
            const result = event.removeListener(listener as checked);

            if (this.autoClean && event.listenerCount === 0) {
                this.deleteEvent(tag);
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
    removeAllByListener(listener: EventListener<ArgumentsOf<T, TagOf<T>>>) {
        for (const [tag, event] of this.map) {
            this.removeListenerFromEvent(tag, event, listener);
        }
    }

    /**
     * 移除所有监听器
     *
     * @param tag 指定标识，默认移除所有监听器
     */
    removeAllListeners(tag?: TagOf<T>) {
        if (tag != null) {
            const event = this.getEvent(tag);
            if (event) {
                event.removeAllListeners();
                if (this.autoClean) {
                    this.deleteEvent(tag);
                }
            }
        } else {
            for (const event of this.map.values()) {
                event.removeAllListeners();
            }

            if (this.autoClean) {
                this.map.clear();
            }
        }
    }

    /**
     * 监听事件
     *
     * @param tag 事件标识
     * @param callback 事件回调函数
     * @param thisArg 函数作用域
     */
    on<Tag extends TagOf<T>>(
        tag: Tag,
        callback: CallbackOf<T, Tag>,
        thisArg?: unknown,
    ) {
        this.addListener(tag, new EventListener(callback, thisArg, false));
    }

    /**
     * 一次性监听事件
     *
     * @param tag 事件标识
     * @param callback 事件回调函数
     * @param thisArg 函数作用域
     */
    once<Tag extends TagOf<T>>(tag: Tag): Promise<ArgumentsOf<T, Tag>>;
    once<Tag extends TagOf<T>>(
        tag: Tag,
        callback: CallbackOf<T, Tag>,
        thisArg?: unknown,
    ): void;
    once<Tag extends TagOf<T>>(
        tag: Tag,
        callback?: CallbackOf<T, Tag>,
        thisArg?: unknown,
    ): void | Promise<ArgumentsOf<T, Tag>> {
        if (callback) {
            this.addListener(tag, new EventListener(callback, thisArg, true));
        } else {
            return new Promise(resolve => {
                this.once(tag, (...args) => {
                    resolve(args);
                });
            });
        }
    }

    /**
     * 取消监听
     *
     * @param tag 事件标识
     * @param callback 事件回调函数
     * @param thisArg 函数作用域
     */
    off<Tag extends TagOf<T>>(
        tag: Tag,
        callback: CallbackOf<T, Tag>,
        thisArg?: unknown,
    ) {
        const event = this.getEvent(tag);
        if (event) {
            event.off(callback, thisArg);

            if (this.autoClean && event.listenerCount === 0) {
                this.deleteEvent(tag);
            }
        }
    }

    /**
     * 取消所有相同函数作用域的监听
     *
     * @param tag 事件标识
     * @param thisArg 函数作用域
     */
    offThisArg<Tag extends TagOf<T>>(tag: Tag, thisArg: unknown) {
        const event = this.getEvent(tag);
        if (event) {
            event.offThisArg(thisArg);

            if (this.autoClean && event.listenerCount === 0) {
                this.deleteEvent(tag);
            }
        }
    }

    /**
     * 移除所有相同回调函数的监听
     *
     * @param callback 回调函数
     * @param thisArg 函数作用域
     */
    offAllBy(callback: CallbackOf<T, TagOf<T>>, thisArg?: unknown) {
        for (const [tag, event] of this.map) {
            event.off(callback as fn<ArgumentsOf<T, TagOf<T>>>, thisArg);

            if (this.autoClean && event.listenerCount === 0) {
                this.deleteEvent(tag);
            }
        }
    }

    /**
     * 移除所有相同函数作用域的监听
     *
     * @param thisArg 函数作用域
     */
    offAllByThisArg(thisArg: unknown) {
        for (const [tag, event] of this.map) {
            event.offThisArg(thisArg);

            if (this.autoClean && event.listenerCount === 0) {
                this.deleteEvent(tag);
            }
        }
    }

    /**
     * 取消所有监听
     *
     * @param tag 指定事件标识，默认移除所有事件的所有监听
     */
    offAll(tag?: TagOf<T>) {
        this.removeAllListeners(tag);
    }

    /**
     * 触发事件
     *
     * @param tag 事件标识
     * @param args 事件参数
     */
    emit<Tag extends TagOf<T>>(tag: Tag, ...args: ArgumentsOf<T, Tag>) {
        const event = this.getEvent(tag);
        if (event) {
            event.emit(...args);
        }
    }

    /**
     * 返回指定事件的可观察对象
     *
     * @param tag 事件标识
     */
    when<Tag extends TagOf<T>>(tag: Tag): Observable<ArgumentsOf<T, Tag>> {
        const event = this.obtainEvent(tag);
        return event.when();
    }

    /**
     * 清理所有未监听的事件
     */
    cleanUnuseEvents() {
        for (const [tag, event] of this.map) {
            if (event.listenerCount === 0) {
                this.deleteEvent(tag);
            }
        }
    }
}

/**
 * 事件声明
 */
export type EventMap = Record<PropertyKey, readonly unknown[]>;

/**
 * 获取 {@link T} 的所有事件标识
 */
export type TagOf<T extends EventMap> = keyof T;

/**
 * 获取 {@link T} 中 {@link Tag} 事件的参数类型
 */
export type ArgumentsOf<T extends EventMap, Tag extends PropertyKey> = (
    T extends Record<Tag, infer V> ? V : uncertain
) extends infer V
    ? // 奇怪不知为何 keyof T 是 unknown
      If<IsUnknown<V>, unknown[], V>
    : never;

/**
 * 获取 {@link T} 中 {@link Tag} 事件的回调类型
 */
export type CallbackOf<T extends EventMap, Tag extends PropertyKey> = (
    ...args: ArgumentsOf<T, Tag>
) => void;
