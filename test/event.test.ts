import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EventEmitter } from '../src/event.js';

describe('Tests for EventEmitter.', () => {
  let emitter: EventEmitter;

  beforeAll(() => {
    emitter = new EventEmitter();
  });

  it('Emit event.', () => {
    let called = false;
    emitter.on('key', () => {
      called = true;
    });
    emitter.emit('key', 1);
    expect(called).toBe(true);
  });

  it('Emit event with arguments.', () => {
    let _args;
    emitter.on('key', (...args) => {
      _args = args;
    });
    emitter.emit('key', 1, 'test', { a: 3 });
    expect(_args).toEqual([1, 'test', { a: 3 }]);
  });

  it('Use await for once.', async () => {
    setTimeout(() => {
      emitter.emit('key', 1, 'test', { a: 3 });
    }, 0);
    const args = await emitter.once('key');
    expect(args).toEqual([1, 'test', { a: 3 }]);
  });

  afterAll(() => {
    emitter.offAll();
  });
});
