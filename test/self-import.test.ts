import { metadata } from '@meojs/std';
import { expect, test } from 'vitest';

test('Self import test', () => {
  expect(metadata).not.toBeNull();
});
