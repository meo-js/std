/**
 * @internal
 * @module
 */
import { isInstance } from '../class.js';
import type { fn } from '../function.js';
import { SafeIterArray } from '../internal/safe-iter-array.js';
import type { EventListener } from './listener.js';

let _callbackForRemove: fn | null = null;
let _thisArgForRemove: unknown = null;

export type InternalStore<Arguments extends readonly unknown[]> =
  | EventListener<Arguments>
  | SafeIterArray<EventListener<Arguments>>;

export function isStrictEmpty<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
) {
  if (store == null) {
    return true;
  } else if (isInstance(store, SafeIterArray)) {
    return store.dirty ? false : store.count === 0;
  } else {
    return false;
  }
}

export function getListenerCount<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
): number {
  if (store == null) {
    return 0;
  } else if (isInstance(store, SafeIterArray)) {
    return store.count;
  } else {
    return 1;
  }
}

export function addListener<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null | undefined,
  listener: EventListener<Arguments>,
): InternalStore<Arguments> {
  if (store == null) {
    return listener;
  } else if (isInstance(store, SafeIterArray)) {
    store.push(listener);
    return store;
  } else {
    const old = store;
    store = new SafeIterArray<EventListener<Arguments>>();
    store.push(old);
    store.push(listener);
    return store;
  }
}

export function removeListener<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
  listener: EventListener<Arguments>,
): InternalStore<Arguments> | null {
  if (store != null && isInstance(store, SafeIterArray)) {
    store.remove(listener);
    return store;
  } else {
    if (store === listener) {
      return null;
    } else {
      return store;
    }
  }
}

export function removeAllListeners<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
): InternalStore<Arguments> | null {
  if (store != null && isInstance(store, SafeIterArray)) {
    store.clear();
    return store;
  } else {
    return null;
  }
}

export function off<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
  callback: fn<Arguments>,
  thisArg?: unknown,
): InternalStore<Arguments> | null {
  if (store != null && isInstance(store, SafeIterArray)) {
    _callbackForRemove = callback;
    _thisArgForRemove = thisArg;
    store.forEach(removeCallback);
    return store;
  } else {
    if (
      store
      && store.callback === callback
      // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
      && store.thisArg == thisArg
    ) {
      return null;
    } else {
      return store;
    }
  }
}

export function offThisArg<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
  thisArg: unknown,
): InternalStore<Arguments> | null {
  if (store != null) {
    if (isInstance(store, SafeIterArray)) {
      store.forEach(removeByThisArg, thisArg);
      return store;
    } else {
      // eslint-disable-next-line eqeqeq -- treat null/undefined equally.
      if (store.thisArg == thisArg) {
        return null;
      } else {
        return store;
      }
    }
  } else {
    return store;
  }
}

export function emit<Arguments extends readonly unknown[]>(
  store: InternalStore<Arguments> | null,
  args: Arguments,
): InternalStore<Arguments> | null {
  if (store != null) {
    if (isInstance(store, SafeIterArray)) {
      store.forEach(emitCallback, args);
      return store;
    } else {
      const listener = store;
      const returnValue = listener.once ? null : listener;
      listener.call(args);
      return returnValue;
    }
  } else {
    return store;
  }
}

function emitCallback<Arguments extends readonly unknown[]>(
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

function removeCallback<Arguments extends readonly unknown[]>(
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
