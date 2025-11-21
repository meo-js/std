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
  arr: T[],
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
  arr: T[],
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
 * 判断数组 A 是否包含数组 B 的所有元素
 *
 * @param a 数组 A
 * @param b 数组 B
 */
export function contains(a: unknown[], b: unknown[]) {
  if (a.length < b.length) return false;

  for (const v of b) {
    let find = false;
    for (let i = 0; i < a.length; i++) {
      const v2 = a[i];
      if (v === v2) {
        find = true;
        break;
      }
    }
    if (!find) return false;
  }
  return true;
}

/**
 * 判断两个数组是否完全相同
 *
 * @param a 数组 A
 * @param b 数组 B
 * @param strictOrder 是否要求一致的元素顺序，默认 `false`
 */
export function containsExactly(
  a: unknown[],
  b: unknown[],
  strictOrder: boolean = false,
) {
  if (a.length !== b.length) return false;

  if (strictOrder) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  } else {
    const temp = [...b];
    for (const v of a) {
      let find = false;
      for (let i = 0; i < temp.length; i++) {
        const v2 = temp[i];
        if (v === v2) {
          find = true;
          temp.splice(i, 1);
          break;
        }
      }
      if (!find) return false;
    }
    return true;
  }
}

/**
 * 将 {@link Arrayable} 值转换为值数组
 */
export function arrayify<T>(value: Arrayable<T>): T[] {
  return Array.isArray(value) ? value : [value];
}
