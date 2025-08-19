/**
 * @public
 * @module
 */
import type * as tf from 'type-fest';

/**
 * 条件类型
 *
 * @template Bool - 布尔值
 * @template Then - 布尔值为 `true` 时返回的类型
 * @template Else - 布尔值为 `false` 时返回的类型
 *
 * @example
 * ```ts
 * type A = If<true, "yes", "no">; // "yes"
 * type B = If<false, "yes", "no">; // "no"
 * ```
 */
export type If<Bool extends boolean, Then, Else> = Bool extends true
  ? Then
  : Else;

/**
 * 逻辑与（AND）操作
 *
 * @returns 当且仅当两个输入都为 `true` 时返回 `true`，否则返回 `false`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = And<true, true>;   // true
 * type T2 = And<true, false>;  // false
 * type T3 = And<false, true>;  // false
 * type T4 = And<false, false>; // false
 * ```
 */
export type And<A extends boolean, B extends boolean> = tf.And<A, B>;

/**
 * 逻辑或（OR）操作
 *
 * @returns 当任意一个输入为 `true` 时返回 `true`，仅当两个输入都为 `false` 时返回 `false`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = Or<true, true>;   // true
 * type T2 = Or<true, false>;  // true
 * type T3 = Or<false, true>;  // true
 * type T4 = Or<false, false>; // false
 * ```
 */
export type Or<A extends boolean, B extends boolean> = tf.Or<A, B>;

/**
 * 逻辑异或（XOR）操作
 *
 * @returns 当两个输入的值不同时返回 `true`，相同时返回 `false`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = Xor<true, true>;   // false
 * type T2 = Xor<true, false>;  // true
 * type T3 = Xor<false, true>;  // true
 * type T4 = Xor<false, false>; // false
 * ```
 */
export type Xor<A extends boolean, B extends boolean> = Or<
  And<A, Not<B>>,
  And<Not<A>, B>
>;

/**
 * 逻辑非（NOT）操作
 *
 * @returns 输入为 `true` 时返回 `false`，输入为 `false` 时返回 `true`
 * @template Bool - 输入的布尔值
 *
 * @example
 * ```ts
 * type T1 = Not<true>;  // false
 * type T2 = Not<false>; // true
 * ```
 */
export type Not<Bool extends boolean> = Bool extends true ? false : true;

/**
 * 逻辑与非（NAND）操作
 *
 * @returns 当且仅当两个输入都为 `true` 时返回 `false`，否则返回 `true`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = Nand<true, true>;   // false
 * type T2 = Nand<true, false>;  // true
 * type T3 = Nand<false, true>;  // true
 * type T4 = Nand<false, false>; // true
 * ```
 */
export type Nand<A extends boolean, B extends boolean> = Not<And<A, B>>;

/**
 * 逻辑或非（NOR）操作
 *
 * @returns 当且仅当两个输入都为 `false` 时返回 `true`，否则返回 `false`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = Nor<true, true>;   // false
 * type T2 = Nor<true, false>;  // false
 * type T3 = Nor<false, true>;  // false
 * type T4 = Nor<false, false>; // true
 * ```
 */
export type Nor<A extends boolean, B extends boolean> = Not<Or<A, B>>;

/**
 * 逻辑同或（XNOR）操作
 *
 * @returns 当两个输入的值相同时返回 `true`，不同时返回 `false`
 * @template A - 第一个布尔值
 * @template B - 第二个布尔值
 *
 * @example
 * ```ts
 * type T1 = Xnor<true, true>;   // true
 * type T2 = Xnor<true, false>;  // false
 * type T3 = Xnor<false, true>;  // false
 * type T4 = Xnor<false, false>; // true
 * ```
 */
export type Xnor<A extends boolean, B extends boolean> = Not<Xor<A, B>>;
