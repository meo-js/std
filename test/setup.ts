import { vi } from 'vitest';
import '../src/polyfill.js';

vi.mock('cc/env', () => {
  return {};
});
