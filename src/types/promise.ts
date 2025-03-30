/**
 * 可能是 {@link Promise} 的类型
 *
 * @template T 兑现值类型
 */
export type MaybePromise<T = unknown> = T | Promise<T>;

/**
 * 可能是 {@link PromiseLike} 的类型
 *
 * @template T 兑现值类型
 */
export type MaybePromiseLike<T = unknown> = T | PromiseLike<T>;

/**
 * 返回 {@link Promise} 兑现后的类型
 *
 * @template T {@link Promise} 类型
 */
export type AwaitedOnce<T extends Promise<unknown>> =
    T extends Promise<infer U> ? U : T;

/**
 * 返回 {@link PromiseLike} 兑现后的类型
 *
 * @template T {@link PromiseLike} 类型
 */
export type AwaitedLikeOnce<T extends PromiseLike<unknown>> =
    T extends PromiseLike<infer U> ? U : T;

/**
 * {@link Promise.withResolvers} 方法返回值
 *
 * @template T 兑现值类型
 */
export type PromiseResolvers<T = unknown> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};
