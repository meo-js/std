import { describe, it } from 'vitest';
import type { EventEmitter, EventMap } from '../src/event.js';

describe('Type Tests for EventEmitter.', () => {
  it('Emit parameters type constraints are correct.', () => {
    type Events = {
      key: [a: number];
      [x: `head-${string}`]: [a: number, b: number];
    };
    let emitter!: EventEmitter<Events>;
    emitter.emit('key', 1);
    emitter.emit('head-a', 1, 2);
    emitter.emit('head-b', 1, 2);
    emitter.emit('head-1', 1, 2);
    // @ts-expect-error -- should throw error
    emitter.emit('another', 1);
  });

  it('The type parameter of emit can trigger IDE auto-completion.', () => {
    let emitter!: EventEmitter<{ key: [] } & EventMap>;
    //                  ↓ You need manally trigger IDE auto-completion for checking.
    emitter.emit('');
  });
});
