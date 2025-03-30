/**
 * 描述类型可能为 `Promise` 类型
 *
 * @param T 任意类型
 */
export type MaybePromise<T = unknown> = T | Promise<T>;

/**
 * 描述类型可能为 `PromiseLike` 类型
 *
 * @param T 任意类型
 */
export type MaybePromiseLike<T = unknown> = T | PromiseLike<T>;

/**
 * 描述 {@link Promise} 类型的值类型
 */
export type PromiseValue<T extends Promise<unknown>> =
    T extends Promise<infer U> ? U : T;

/**
 * 描述 {@link PromiseLike} 类型的值类型
 */
export type PromiseLikeValue<T extends PromiseLike<unknown>> =
    T extends PromiseLike<infer U> ? U : T;

/**
 * {@link Promise.withResolvers} 方法的返回值
 */
export type PromiseResolvers<T = unknown> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};
