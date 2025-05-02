/**
 * 值对象
 */
export interface ValueLike<out T = unknown> {
    value: T;
}

/**
 * 只读值对象
 */
export type ReadonlyValueLike<out T = unknown> = Readonly<ValueLike<T>>;
