import { expect, test } from 'vitest';
import {
  difference,
  intersection,
  isDisjointFrom,
  isSubsetOf,
  symmetricDifference,
  union,
} from '../src/array.js';

test('isSubsetOf returns true when every element appears enough times.', () => {
  expect(isSubsetOf([1, 2, 2], [2, 1, 2, 3])).toBe(true);
});

test('isSubsetOf returns false when multiplicity is insufficient.', () => {
  expect(isSubsetOf([2, 2], [2, 3])).toBe(false);
});

test('isSubsetOf treats empty arrays as subsets.', () => {
  expect(isSubsetOf([], [1, 2, 3])).toBe(true);
});

test('difference returns elements in a not in b', () => {
  expect(difference([1, 2, 3], [2])).toEqual([1, 3]);
});

test('difference handles multiset semantics', () => {
  expect(difference([1, 2, 2], [2])).toEqual([1, 2]);
  expect(difference([1, 2, 2], [2, 2])).toEqual([1]);
  expect(difference([1, 2, 2], [2, 2, 2])).toEqual([1]);
});

test('difference handles empty arrays', () => {
  expect(difference([], [1, 2])).toEqual([]);
  expect(difference([1, 2], [])).toEqual([1, 2]);
  expect(difference([], [])).toEqual([]);
});

test('difference handles same array', () => {
  const arr = [1, 2];
  expect(difference(arr, arr)).toEqual([]);
});

test('difference handles no overlap', () => {
  expect(difference([1, 2], [3, 4])).toEqual([1, 2]);
});

test('symmetricDifference returns elements in a not in b and b not in a', () => {
  expect(symmetricDifference([1, 2, 3], [3, 4, 5])).toEqual([1, 2, 4, 5]);
});

test('symmetricDifference handles multiset semantics', () => {
  expect(symmetricDifference([1, 2, 2], [2, 3])).toEqual([1, 2, 3]);
  expect(symmetricDifference([1, 2, 2], [2, 2, 3])).toEqual([1, 3]);
  expect(symmetricDifference([1, 2, 2], [2, 2, 2, 3])).toEqual([1, 2, 3]);
});

test('symmetricDifference handles empty arrays', () => {
  expect(symmetricDifference([], [1, 2])).toEqual([1, 2]);
  expect(symmetricDifference([1, 2], [])).toEqual([1, 2]);
  expect(symmetricDifference([], [])).toEqual([]);
});

test('symmetricDifference handles same array', () => {
  const arr = [1, 2];
  expect(symmetricDifference(arr, arr)).toEqual([]);
});

test('symmetricDifference handles no overlap', () => {
  expect(symmetricDifference([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
});

test('isDisjointFrom returns true if no common elements', () => {
  expect(isDisjointFrom([1, 2], [3, 4])).toBe(true);
});

test('isDisjointFrom returns false if common elements exist', () => {
  expect(isDisjointFrom([1, 2], [2, 3])).toBe(false);
});

test('isDisjointFrom handles empty arrays', () => {
  expect(isDisjointFrom([], [1, 2])).toBe(true);
  expect(isDisjointFrom([1, 2], [])).toBe(true);
  expect(isDisjointFrom([], [])).toBe(true);
});

test('intersection returns common elements with min multiplicity', () => {
  expect(intersection([1, 2, 2], [2, 2, 3])).toEqual([2, 2]);
  expect(intersection([1, 2], [3, 4])).toEqual([]);
});

test('intersection handles empty arrays', () => {
  expect(intersection([], [1, 2])).toEqual([]);
  expect(intersection([1, 2], [])).toEqual([]);
});

test('union returns multiset union with max multiplicity', () => {
  expect(union([1, 2, 2], [2, 3])).toEqual([1, 2, 2, 3]);
});

test('union handles empty arrays', () => {
  expect(union([], [1, 2])).toEqual([1, 2]);
  expect(union([1, 2], [])).toEqual([1, 2]);
});
