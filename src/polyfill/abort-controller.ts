import type { fn } from "../function.js";
import type { checked } from "../ts.js";

type Event = { type: string };
type Listener = { callback: fn<[event: Event]>; once: boolean };

if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    globalThis.AbortController === undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    || globalThis.AbortSignal === undefined
) {
    const abortName = "AbortError";
    const abortMessage = "signal is aborted without reason";
    const abortEvent: Event = { type: "abort" };

    function normalizeAbortReason(reason: unknown) {
        if (reason === undefined) {
            if (typeof document === "undefined") {
                reason = new Error(abortMessage);
                (<Error>reason).name = abortName;
            } else {
                try {
                    reason = new DOMException(abortMessage);
                    // The DOMException does not support setting the name property directly.
                    Object.defineProperty(reason, "name", {
                        value: abortName,
                    });
                } catch (err) {
                    // IE 11 does not support calling the DOMException constructor, use a
                    // regular error object on it instead.
                    reason = new Error(abortMessage);
                    (<Error>reason).name = abortName;
                }
            }
        }
        return reason;
    }

    class AbortSignal {
        private _listeners: null | Listener | Listener[] = null;

        onabort: ((this: AbortSignal, ev: Event) => unknown) | null = null;
        aborted: boolean = false;
        reason: unknown;

        addEventListener(
            type: string,
            callback: fn<[event: Event]>,
            options?: { once?: boolean },
        ) {
            if (type !== "abort") {
                return;
            }

            const listener = { callback, once: options?.once ?? false };
            if (this._listeners === null) {
                this._listeners = listener;
            } else if (Array.isArray(this._listeners)) {
                this._listeners.push(listener);
            } else {
                this._listeners = [this._listeners, listener];
            }
        }

        removeEventListener(
            type: string,
            callback: fn<[event: Event]>,
            options?: unknown,
        ) {
            if (type !== "abort") {
                return;
            }

            if (Array.isArray(this._listeners)) {
                for (let i = 0, l = this._listeners.length; i < l; i++) {
                    if (this._listeners[i].callback === callback) {
                        this._listeners.splice(i, 1);
                        return;
                    }
                }
            } else {
                if (this._listeners?.callback === callback) {
                    this._listeners = null;
                }
            }
        }

        dispatchEvent(event: Event) {
            if (event.type !== "abort") {
                return true;
            }

            this.aborted = true;

            this.onabort?.call(this, event);

            if (Array.isArray(this._listeners)) {
                // TODO 不安全的实现
                const stack = this._listeners;
                const stackToCall = stack.slice();
                for (let i = 0, l = stackToCall.length; i < l; i++) {
                    const listener = stackToCall[i];
                    try {
                        listener.callback.call(this, event);
                    } catch (e) {
                        reportError(e);
                    }
                    if (listener.once) {
                        this.removeEventListener(event.type, listener.callback);
                    }
                }
            } else {
                if (this._listeners) {
                    try {
                        this._listeners.callback.call(this, event);
                    } catch (e) {
                        reportError(e);
                    }
                }
            }

            return true;
        }

        when(type: unknown, options?: unknown): unknown {
            // TODO
            return null;
        }

        throwIfAborted() {
            const { aborted, reason } = this;
            if (!aborted) return;
            throw reason;
        }

        [Symbol.toStringTag]() {
            return "[object AbortSignal]";
        }

        toString() {
            return this[Symbol.toStringTag]();
        }
    }

    class AbortController {
        // NOTE: 原生实现的 signal 是不可枚举属性，这里与原生实现不一样
        signal = new AbortSignal();

        abort(reason?: unknown) {
            const signalReason = normalizeAbortReason(reason);
            this.signal.reason = signalReason;
            this.signal.dispatchEvent(abortEvent);
        }

        [Symbol.toStringTag]() {
            return "[object AbortController]";
        }

        toString() {
            return this[Symbol.toStringTag]();
        }
    }

    globalThis.AbortController = AbortController as checked;
    globalThis.AbortSignal = AbortSignal as checked;
}
