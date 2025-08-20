import { COCOS } from 'compile-constant';
import { expect, test } from 'vitest';
import { DEBUG } from '../src/macro.js';

test('The Environment is default.', () => {
  expect(COCOS).toBe(false);
  expect(DEBUG).toBe(process.env.NODE_ENV === 'production');
});
