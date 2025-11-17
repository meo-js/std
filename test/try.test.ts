import { expect, test } from 'vitest';
import { error, ok, Result, try_ } from '../src/try.js';

test('Create a successful result with Result.ok.', () => {
  const result = Result.ok(123);
  expect(result.ok).toBe(true);
  expect(result.value).toBe(123);
  expect(result.error).toBeUndefined();
});

test('Create a failed result with Result.error.', () => {
  const result = Result.error('fail');
  expect(result.ok).toBe(false);
  expect(result.error).toBe('fail');
  expect(result.value).toBeUndefined();
});

test('Wrap a synchronous function with Result.try.', () => {
  const result = Result.try(() => 'value');
  expect(result.ok).toBe(true);
  expect(result.value).toBe('value');
});

test('Capture thrown errors with Result.try.', () => {
  const error = new Error('fail');
  const result = Result.try(() => {
    throw error;
  });
  expect(result.ok).toBe(false);
  expect(result.error).toBe(error);
});

test('Resolve promises with Result.try.', async () => {
  const result = await Result.try(Promise.resolve('async'));
  expect(result.ok).toBe(true);
  expect(result.value).toBe('async');
});

test('Capture rejected promises with Result.try.', async () => {
  const rejection = new TypeError('reject');
  const result = await Result.try(Promise.reject(rejection));
  expect(result.ok).toBe(false);
  expect(result.error).toBe(rejection);
});

test('Keep helper functions delegating to static methods.', () => {
  expect(ok(1)).toStrictEqual(Result.ok(1));
  expect(error('oops')).toStrictEqual(Result.error('oops'));
  expect(try_(() => 9)).toStrictEqual(Result.try(() => 9));
});
