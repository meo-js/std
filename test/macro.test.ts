import { COCOS, DEFAULT, NODE } from 'compile-constant';
import { expect, test } from 'vitest';
import { DEBUG, ROOKIE, USE_LEGACY_DECORATOR } from '../src/macro.js';

test('The Environment is default.', () => {
  expect(COCOS).toBe(false);
  expect(DEFAULT).toBe(true);
  expect(NODE).toBe(false);
  expect(DEBUG).toBe(false);
  expect(ROOKIE).toBe(false);
  expect(USE_LEGACY_DECORATOR).toBe(false);
});
