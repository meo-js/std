/**
 * @public
 * @module
 */
import { isIterable } from './predicate.js';
import type { checked } from './ts.js';

/**
 * 将 {@link Iterator} 转换为 {@link Iterable} 对象
 */
export function toIterable<T, TReturn, TNext>(
  iterator: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>,
): Iterable<T, TReturn, TNext> {
  if (isIterable(iterator)) {
    return iterator as checked;
  } else {
    return {
      [Symbol.iterator]() {
        return iterator;
      },
    };
  }
}
