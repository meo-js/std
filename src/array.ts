/**
 * @public
 * @module
 */
import type * as sts from 'string-ts';
import type * as tf from 'type-fest';
import type { INF, Sub } from './math.js';
import type { IsNever } from './predicate.js';
import type { Rng } from './protocol.js';
import type { IsLiteral, ToArray } from './ts.js';
import type { If } from './ts/logical.js';

/**
 * 数组索引类型
 */
export type IndicesOf<T extends readonly unknown[]> = If<
  IsNever<tf.ArrayIndices<T>>,
  number,
  tf.ArrayIndices<T>
>;

/**
 * 数组值类型
 */
export type ValueOf<T extends readonly unknown[]> = tf.ArrayValues<T>;

/**
 * 数组元素类型
 *
 * @example
 * ```ts
 * EntriesOf<["a", "b", "c"]>;
 * // [[0, "a"], [1, "b"], [2, "c"]]
 *
 * EntriesOf<number[]>;
 * // [number, number][]
 * ```
 */
export type EntriesOf<T extends readonly unknown[]> = If<
  IsLiteral<IndicesOf<T>>,
  Zip<ToArray<IndicesOf<T>>, ToArray<ValueOf<T>>>,
  [IndicesOf<T>, ValueOf<T>][]
>;

/**
 * 数组的第一个元素
 */
export type First<T extends readonly unknown[]> = T extends readonly [
  infer F,
  ...unknown[],
]
  ? F
  : never;

/**
 * 数组的最后一个元素
 */
export type Last<T extends readonly unknown[]> = tf.LastArrayElement<T>;

/**
 * 数组的除第一个元素外的剩余元素
 */
export type Rest<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer R,
]
  ? R
  : never;

/**
 * 展平数组
 *
 * @template T 数组
 * @template Depth 展平深度，默认为 1
 *
 * @example
 * ```ts
 * Flat<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, [6, 7]]
 * ```
 */
export type Flat<
  T extends readonly unknown[],
  Depth extends number = 1,
> = Depth extends 0
  ? T
  : T extends readonly [infer U, ...infer R]
    ? U extends readonly unknown[]
      ? [...Flat<U, Sub<Depth, 1>>, ...Flat<R, Depth>]
      : [U, ...Flat<R, Depth>]
    : [];

/**
 * 递归地展平数组
 *
 * @template T 数组
 *
 * @example
 * ```ts
 * FlatDeep<[1, 2, [3, 4], [5, [6, 7]]]>;
 * // [1, 2, 3, 4, 5, 6, 7]
 * ```
 */
export type FlatDeep<T extends readonly unknown[]> = Flat<T, INF>;

/**
 * 返回一个布尔值，用于判断给定数组是否包含给定项
 */
export type Includes<T extends readonly unknown[], Item> = tf.Includes<T, Item>;

/**
 * 返回数组指定范围的切片
 */
export type Slice<
  T extends readonly unknown[],
  Start extends number = never,
  End extends number = never,
> = tf.ArraySlice<T, Start, End>;

/**
 * 在数组中指定索引范围内添加或删除元素
 */
export type Splice<
  T extends readonly unknown[],
  Start extends number,
  DeleteCount extends number,
  Items extends readonly unknown[] = [],
> = tf.ArraySplice<T, Start, DeleteCount, Items>;

/**
 * 将字符串数组拼接为字符串
 */
export type Join<
  T extends readonly string[],
  Delimiter extends string = ',',
> = sts.Join<T, Delimiter>;

/**
 * 将两个数组的元素配对为元组数组
 *
 * @example
 * ```ts
 * Zip<[1, 2, 3], ["a", "b", "c"]>;
 * // [[1, "a"], [2, "b"], [3, "c"]]
 *
 * Zip<[1, 2], ["a", "b", "c"]>;
 * // [[1, "a"], [2, "b"]]
 *
 * Zip<[1, 2, 3], ["a", "b"]>;
 * // [[1, "a"], [2, "b"]]
 * ```
 */
export type Zip<
  A extends readonly unknown[],
  B extends readonly unknown[],
> = A extends readonly [infer AF, ...infer AR]
  ? B extends readonly [infer BF, ...infer BR]
    ? [[AF, BF], ...Zip<AR, BR>]
    : []
  : [];

/**
 * 值或值类型的数组
 */
export type Arrayable<T> = tf.Arrayable<T>;

/**
 * 数组转为对象类型
 */
export type ToObject<T extends readonly unknown[]> = tf.TupleToObject<T>;

/**
 * 移除数组指定下标元素
 *
 * 函数未进行下标检查。
 *
 * @param arr 数组
 * @param index 下标
 */
export function removeAt(arr: unknown[], index: number) {
  arr.splice(index, 1);
}

/**
 * 移除指定数组元素，返回是否移除成功
 *
 * @param arr 数组
 * @param value 元素
 */
export function remove(arr: unknown[], value: unknown) {
  const index = arr.indexOf(value);
  if (index === -1) return false;
  removeAt(arr, index);
  return true;
}

/**
 * 快速移除数组指定下标元素
 *
 * 采用直接与最后一位元素交换的方式进行移除，函数未进行下标检查。
 *
 * @param arr 数组
 * @param index 数组下标
 */
export function swapRemoveAt(arr: unknown[], index: number) {
  arr[index] = arr[arr.length - 1];
  arr.pop();
}

/**
 * 快速移除数组指定元素，返回是否移除成功
 *
 * 采用直接与最后一位元素交换的方式进行移除。
 *
 * @param arr 数组
 * @param value 元素
 */
export function swapRemove(arr: unknown[], value: unknown) {
  const index = arr.indexOf(value);
  if (index === -1) return false;
  swapRemoveAt(arr, index);
  return true;
}

/**
 * 交换数组指定下标的两个元素
 *
 * @param arr 数组
 * @param indexA 下标 A
 * @param indexB 下标 B
 */
export function swap<T>(arr: T[], indexA: number, indexB: number): T[] {
  const temp = arr[indexA];
  arr[indexA] = arr[indexB];
  arr[indexB] = temp;
  return arr;
}

/**
 * 插入值到指定数组下标
 *
 * @param arr 数组
 * @param value 值
 * @param index 下标
 */
export function insert(arr: unknown[], value: unknown, index: number) {
  arr.splice(index, 0, value);
}

/**
 * 随机选取一个数组元素
 *
 * @param arr 数组
 * @param rng 随机数生成函数，默认 {@link Math.random}
 */
export function sample<T>(
  arr: readonly T[],
  rng: () => number = Math.random,
): T | undefined {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 随机选取指定数量的数组元素
 *
 * @param arr 数组
 * @param count 数量
 * @param duplicate 是否允许重复选取，默认 `false`
 * @param rng 随机数生成函数，默认 {@link Math.random}
 */
export function samples<T>(
  arr: readonly T[],
  count: number,
  duplicate: boolean = false,
  rng: () => number = Math.random,
) {
  count = Math.min(count, arr.length);

  const result = new Array<T>(count);

  if (duplicate) {
    for (let i = 0; i < count; i++) {
      result[i] = arr[Math.floor(rng() * arr.length)];
    }
  } else {
    // 必须用 Set 存储下标而不是存储元素本身，因为元素本身可能重复
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let index = Math.floor(rng() * arr.length);
      while (used.has(index)) {
        index = Math.floor(rng() * arr.length);
      }
      used.add(index);
      result[i] = arr[index];
    }
  }

  return result;
}

/**
 * 随机打乱数组
 *
 * @param arr 数组
 * @param rng 随机数生成函数，默认 {@link Math.random}
 */
export function shuffle<T>(arr: T[], rng: Rng = Math.random) {
  let m = arr.length,
    t = undefined,
    i = 0;

  while (m !== 0) {
    i = Math.floor(rng() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }

  return arr;
}

/**
 * 删除 {@link Array} 所有 `undefined` 的值
 */
export function prune<T extends unknown[]>(v: T): T {
  for (let i = v.length - 1; i >= 0; i--) {
    if (v[i] === undefined) {
      v.splice(i, 1);
    }
  }
  return v;
}

/**
 * 判断两个数组是否完全相同
 *
 * @param a 数组 A
 * @param b 数组 B
 * @param strictOrder 是否要求一致的元素顺序，默认 `false`
 */
export function isEquivalentOf(
  a: readonly unknown[],
  b: readonly unknown[],
  strictOrder: boolean = false,
) {
  const al = a.length;
  const bl = b.length;
  if (al !== bl) return false;
  if (a === b) return true;

  if (strictOrder) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  } else {
    const used = new Uint8Array(al);

    for (let i = 0; i < al; i++) {
      const value = a[i];
      let matched = false;

      for (let j = 0; j < al; j++) {
        if (used[j] === 0 && value === b[j]) {
          used[j] = 1;
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }
    return true;
  }
}

/**
 * Checks whether the {@link a} is a superset of {@link b}.
 *
 * The superset relationship is not proper superset, meaning it returns true
 * if {@link a} and {@link b} contain the same elements, or if {@link b} is empty.
 */
export function isSupersetOf(
  a: readonly unknown[],
  b: readonly unknown[],
): boolean {
  return isSubsetOf(b, a);
}

/**
 * Checks whether the {@link a} is a subset of {@link b}.
 *
 * The subset relationship is not proper subset, meaning it returns true
 * if {@link a} and {@link b} contain the same elements, or if {@link a} is empty.
 */
export function isSubsetOf(
  a: readonly unknown[],
  b: readonly unknown[],
): boolean {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return true;
  if (al > bl) return false;
  if (a === b) return true;

  const used = new Uint8Array(bl);

  for (let i = 0; i < al; i++) {
    const value = a[i];
    let matched = false;
    for (let j = 0; j < bl; j++) {
      if (used[j] === 0 && value === b[j]) {
        used[j] = 1;
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }

  return true;
}

/**
 * Checks whether the {@link a} is disjoint from {@link b} (they have no elements in common).
 */
export function isDisjointFrom(
  a: readonly unknown[],
  b: readonly unknown[],
): boolean {
  const al = a.length;
  const bl = b.length;
  if (al === 0 || bl === 0) return true;
  if (a === b) return false;

  for (let i = 0; i < al; i++) {
    const value = a[i];
    for (let j = 0; j < bl; j++) {
      if (value === b[j]) return false;
    }
  }

  return true;
}

/**
 * Returns a new array containing elements found in both {@link a} and {@link b}.
 *
 * If an element appears `n` times in {@link a} and `m` times in {@link b},
 * it will appear `min(n, m)` times in the result.
 */
export function intersection<T>(a: readonly T[], b: readonly T[]): T[] {
  const al = a.length;
  const bl = b.length;
  if (al === 0 || bl === 0) return [];
  if (a === b) return a.slice();

  const result: T[] = [];
  const used = new Uint8Array(bl);

  for (let i = 0; i < al; i++) {
    const value = a[i];
    for (let j = 0; j < bl; j++) {
      if (used[j] === 0 && value === b[j]) {
        used[j] = 1;
        result.push(value);
        break;
      }
    }
  }

  return result;
}

/**
 * Returns a new array containing elements in {@link a} that are not in {@link b}.
 *
 * If an element appears `n` times in {@link a} and `m` times in {@link b},
 * it will appear `max(0, n - m)` times in the result.
 */
export function difference<T>(a: readonly T[], b: readonly T[]): T[] {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return [];
  if (bl === 0) return a.slice();
  if (a === b) return [];

  const result: T[] = [];
  const used = new Uint8Array(bl);

  for (let i = 0; i < al; i++) {
    const value = a[i];
    let matched = false;
    for (let j = 0; j < bl; j++) {
      if (used[j] === 0 && value === b[j]) {
        used[j] = 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push(value);
    }
  }

  return result;
}

/**
 * Returns a new array containing elements in {@link a} that are not in {@link b}
 * and elements in {@link b} that are not in {@link a}.
 *
 * If an element appears `n` times in {@link a} and `m` times in {@link b},
 * it will appear `|n - m|` times in the result.
 */
export function symmetricDifference<T>(a: readonly T[], b: readonly T[]): T[] {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return b.slice();
  if (bl === 0) return a.slice();
  if (a === b) return [];

  const result: T[] = [];
  const used = new Uint8Array(bl);

  for (let i = 0; i < al; i++) {
    const value = a[i];
    let matched = false;
    for (let j = 0; j < bl; j++) {
      if (used[j] === 0 && value === b[j]) {
        used[j] = 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push(value);
    }
  }

  for (let j = 0; j < bl; j++) {
    if (used[j] === 0) {
      result.push(b[j]);
    }
  }

  return result;
}

/**
 * Returns a new array containing the multiset union of {@link a} and {@link b}.
 *
 * If an element appears `n` times in {@link a} and `m` times in {@link b},
 * it will appear `max(n, m)` times in the result.
 */
export function union<T>(a: readonly T[], b: readonly T[]): T[] {
  const result = a.slice();
  const al = a.length;
  const bl = b.length;
  const used = new Uint8Array(al);

  for (let i = 0; i < bl; i++) {
    const value = b[i];
    let found = false;

    for (let j = 0; j < al; j++) {
      if (used[j] === 0 && a[j] === value) {
        used[j] = 1;
        found = true;
        break;
      }
    }

    if (!found) {
      result.push(value);
    }
  }

  return result;
}

/**
 * 将 {@link Arrayable} 值转换为值数组
 */
export function arrayify<T>(value: Arrayable<T>): T[] {
  return Array.isArray(value) ? value : [value];
}
