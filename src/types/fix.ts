/**
 * 作为对某些 Linter 规则的逃生窗口，例如 ESLint 的 `no-explicit-any` 规则，原则上尽量避免使用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type Any = any;

/**
 * 作为对某些 Linter 规则的逃生窗口，例如 ESLint 的 `no-explicit-any` 规则，原则上尽量避免使用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type Anys = any[];

/**
 * 原始 JavaScript 值类型
 */
export type Primitive =
    | number
    | symbol
    | string
    | boolean
    | bigint
    | undefined
    | null;

/**
 * 类型 `null | undefined` 的简写形式
 */
export type none = null | undefined;

/**
 * 类型化数组
 */
export type TypedArray =
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array
    | Int8Array
    | Int16Array
    | Int32Array
    | BigUint64Array
    | BigInt64Array
    // | Float16Array (unstable)
    | Float32Array
    | Float64Array;
