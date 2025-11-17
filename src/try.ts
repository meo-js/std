/**
 * @public
 * @module
 */
import type { IsAny } from 'type-fest';
import type { fn } from './function.js';
import { isFunction, type IsNever } from './predicate.js';

/**
 * A `Result` represents the outcome of an operation, encapsulating either a success (`ok:
 * true`) or a failure (`ok: false`).
 *
 * It can be used as both a named object and a destructurable tuple.
 */
export type Result<T, E = unknown> = ValueResult<T> | ErrorResult<E>;

/**
 * Represents a successful result.
 *
 * This object can be destructured like a tuple: `[ok, error, value]`, or accessed via
 * named properties: (`ok`, `error`, `value`).
 *
 * @see {@link Result}
 * @see {@link ErrorResult}
 */
export type ValueResult<T> = {
  ok: true;
  error: never;
  value: T;
} & [ok: true, error: never, value: T];

/**
 * Represents a failed result.
 *
 * This object can be destructured like a tuple: `[ok, error, value]`, or accessed via
 * named properties: (`ok`, `error`, `value`).
 *
 * @see {@link Result}
 * @see {@link ValueResult}
 */
export type ErrorResult<E = unknown> = {
  ok: false;
  error: E;
  value: never;
} & [ok: false, error: E, value: never];

type TryResult<T> =
  IsAny<T> extends true
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
      Result<any>
    : IsNever<T> extends true
      ? ErrorResult
      : T extends PromiseLike<never>
        ? Promise<ErrorResult>
        : T extends PromiseLike<infer U>
          ? Promise<Result<Awaited<U>>>
          : Result<T>;

class ResultConstructor {
  /**
   * Creates a successful {@link Result}.
   *
   * @param value The value to wrap.
   * @returns A {@link Result} with `ok: true`.
   */
  static ok(): ValueResult<void>;
  static ok<T = unknown>(value: T): ValueResult<T>;
  static ok<T = unknown>(value?: T): ValueResult<T> {
    return new ResultConstructor(true, undefined, value) as ValueResult<T>;
  }

  /**
   * Creates a failed {@link Result}.
   *
   * @param error The error to wrap.
   * @returns A {@link Result} with `ok: false`.
   */
  static error(): ErrorResult<void>;
  static error<E = unknown>(error: E): ErrorResult<E>;
  static error<E = unknown>(error?: E): ErrorResult<E> {
    return new ResultConstructor(false, error, undefined) as ErrorResult<E>;
  }

  /**
   * Executes a function or wraps a value in a {@link Result}.
   *
   * If the value is a promise or the function returns a promise,
   * the result is awaited and wrapped.
   *
   * If the function throws or the promise rejects, the error is captured as a
   * failed {@link Result}.
   *
   * @param value The value to wrap.
   * @param fn The function to execute.
   * @param args Arguments to pass to the function.
   * @returns A {@link Result} or a {@link Promise}<{@link Result}>, depending
   * on the function or value type.
   *
   * @example
   *
   * ```ts
   * const [ok, error, value] = Result.try(syncFn, arg1, arg2);
   * const [ok, error, value] = await Result.try(asyncFn, arg1, arg2);
   *
   * const [ok, error, value] = Result.try(() => syncFn(arg1, arg2));
   * const [ok, error, value] = await Result.try(async () => await asyncFn(arg1, arg2));
   *
   * const [ok, error, value] = await Result.try(Promise.resolve('pass'));
   * const [ok, error, value] = await Result.try(Promise.reject('fail'));
   *
   * const [ok, error, value] = await Result.try(object);
   * const [ok, error, value] = await Result.try(array);
   * ```
   */
  static try<T>(value: T): TryResult<T>;
  static try<const T extends fn>(
    fn: T,
    ...args: Parameters<T>
  ): TryResult<ReturnType<T>>;
  static try(arg1: unknown, ...args: unknown[]): unknown {
    try {
      if (isFunction(arg1)) {
        // eslint-disable-next-line prefer-spread -- checked.
        arg1 = (<fn>arg1).apply(undefined, args);
      }

      if (arg1 instanceof Promise) {
        return arg1.then(
          value => this.ok(value),
          (error: unknown) => this.error(error),
        );
      }

      return this.ok(arg1);
    } catch (error) {
      return this.error(error);
    }
  }

  declare readonly ok: boolean;
  declare readonly error: unknown;
  declare readonly value: unknown;

  constructor(ok: boolean, error: unknown, value: unknown) {
    if (ok) {
      this.ok = true;
      this.value = value;
    } else {
      this.ok = false;
      this.error = error;
    }
  }

  *[Symbol.iterator]() {
    yield this.ok;
    yield this.error;
    yield this.value;
  }
}

export const Result = ResultConstructor;

/**
 * Creates a successful {@link Result}.
 *
 * @param value The value to wrap.
 * @returns A {@link Result} with `ok: true`.
 */
export function ok(): ValueResult<void>;
export function ok<T = unknown>(value: T): ValueResult<T>;
export function ok<T = unknown>(value?: T): ValueResult<T> {
  return Result.ok(value as T);
}

/**
 * Creates a failed {@link Result}.
 *
 * @param error The error to wrap.
 * @returns A {@link Result} with `ok: false`.
 */
export function error(): ErrorResult<void>;
export function error<E = unknown>(error: E): ErrorResult<E>;
export function error<E = unknown>(error?: E): ErrorResult<E> {
  return Result.error(error as E);
}

/**
 * Executes a function or wraps a value in a {@link Result}.
 *
 * If the value is a promise or the function returns a promise,
 * the result is awaited and wrapped.
 *
 * If the function throws or the promise rejects, the error is captured as a
 * failed {@link Result}.
 *
 * @param value The value to wrap.
 * @param fn The function to execute.
 * @param args Arguments to pass to the function.
 * @returns A {@link Result} or a {@link Promise}<{@link Result}>, depending
 * on the function or value type.
 *
 * @example
 *
 * ```ts
 * const [ok, error, value] = Result.try(syncFn, arg1, arg2);
 * const [ok, error, value] = await Result.try(asyncFn, arg1, arg2);
 *
 * const [ok, error, value] = Result.try(() => syncFn(arg1, arg2));
 * const [ok, error, value] = await Result.try(async () => await asyncFn(arg1, arg2));
 *
 * const [ok, error, value] = await Result.try(Promise.resolve('pass'));
 * const [ok, error, value] = await Result.try(Promise.reject('fail'));
 *
 * const [ok, error, value] = await Result.try(object);
 * const [ok, error, value] = await Result.try(array);
 * ```
 */
export function try_<T>(value: T): TryResult<T>;
export function try_<const T extends fn>(
  fn: T,
  ...args: Parameters<T>
): TryResult<ReturnType<T>>;
export function try_(...args: unknown[]): unknown {
  // eslint-disable-next-line prefer-spread -- checked.
  return Result.try.apply(Result, args as never);
}
