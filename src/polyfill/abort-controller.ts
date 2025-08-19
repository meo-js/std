import { Event as _Event } from '../event.js';
import type { fn } from '../function.js';
import type { checked } from '../ts.js';

type Event = { type: string };

if (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
  globalThis.AbortController === undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
  || globalThis.AbortSignal === undefined
) {
  const defaultAbortName = 'AbortError';
  const defaultAbortMessage = 'signal is aborted without reason';
  const timeoutAbortName = 'TimeoutError';
  const timeoutAbortMessage = 'signal timed out';
  const abortEvent: Event = { type: 'abort' };

  function normalizeReason(
    abortName: string,
    abortMessage: string,
    reason?: unknown,
  ) {
    if (reason === undefined) {
      if (typeof document === 'undefined') {
        reason = new Error(abortMessage);
        (<Error>reason).name = abortName;
      } else {
        try {
          reason = new DOMException(abortMessage);
          // The DOMException does not support setting the name property directly.
          Object.defineProperty(reason, 'name', {
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

  function timeoutHandler(signal: AbortSignal) {
    signal.reason = normalizeReason(timeoutAbortName, timeoutAbortMessage);
    signal.dispatchEvent(abortEvent);
  }

  class AbortSignal {
    static abort(reason?: unknown) {
      const signal = new AbortSignal();
      signal.reason = normalizeReason(
        defaultAbortName,
        defaultAbortMessage,
        reason,
      );
      signal.aborted = true;
      return signal;
    }

    static any(signals: Iterable<AbortSignal>): AbortSignal {
      const listenedSignals: AbortSignal[] = [];

      const clear = function (signals: AbortSignal[]) {
        for (const signal of signals) {
          signal.removeEventListener('abort', abortHandler);
        }
      };

      const abortHandler = function (this: AbortSignal) {
        if (this === result) {
          clear(listenedSignals);
        } else {
          if (!result.aborted) {
            clear(listenedSignals);
            result.reason = this.reason;
            result.dispatchEvent(abortEvent);
          }
        }
      };

      for (const signal of signals) {
        if (signal.aborted) {
          clear(listenedSignals);
          return AbortSignal.abort(signal.reason);
        } else {
          signal.addEventListener('abort', abortHandler, {
            once: true,
          });
          listenedSignals.push(signal);
        }
      }

      const result = new AbortSignal();

      result.addEventListener('abort', abortHandler);

      return result;
    }

    static timeout(time: number) {
      const signal = new AbortSignal();
      setTimeout(timeoutHandler, time, signal);
      return signal;
    }

    onabort: ((this: AbortSignal, ev: Event) => unknown) | null = null;
    aborted: boolean = false;
    reason: unknown;

    private _event = new _Event<[event: Event]>();

    addEventListener(
      type: string,
      callback: fn<[event: Event]>,
      options?: { once?: boolean },
    ) {
      if (type !== 'abort') {
        return;
      }
      this._event.on(callback);
    }

    removeEventListener(
      type: string,
      callback: fn<[event: Event]>,
      options?: unknown,
    ) {
      if (type !== 'abort') {
        return;
      }
      this._event.off(callback);
    }

    dispatchEvent(event: Event) {
      if (event.type !== 'abort') {
        return true;
      }

      this.aborted = true;

      this.onabort?.call(this, event);
      this._event.emit(event);

      return true;
    }

    when(type: unknown, options?: unknown): unknown {
      // FIXME: 等待 Observable 提案普及后再实现
      throw new Error('AbortSignal.when is not implemented');
    }

    throwIfAborted() {
      const { aborted, reason } = this;
      if (!aborted) return;
      throw reason;
    }

    [Symbol.toStringTag]() {
      return '[object AbortSignal]';
    }

    toString() {
      return this[Symbol.toStringTag]();
    }
  }

  class AbortController {
    // 原生实现的 signal 是不可枚举属性，这里故意与原生实现不一样
    signal = new AbortSignal();

    abort(reason?: unknown) {
      if (!this.signal.aborted) {
        this.signal.reason = normalizeReason(
          defaultAbortName,
          defaultAbortMessage,
          reason,
        );
        this.signal.dispatchEvent(abortEvent);
      }
    }

    [Symbol.toStringTag]() {
      return '[object AbortController]';
    }

    toString() {
      return this[Symbol.toStringTag]();
    }
  }

  globalThis.AbortController = AbortController as checked;
  globalThis.AbortSignal = AbortSignal as checked;
}
