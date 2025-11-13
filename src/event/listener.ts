import type { fn } from '../function.js';
import type { uncertain } from '../ts.js';

/**
 * 事件监听器
 */
export class EventListener<Arguments extends readonly unknown[] = uncertain> {
  constructor(
    /**
     * @internal
     */
    public callback: fn<Arguments>,
    /**
     * @internal
     */
    public thisArg: unknown = undefined,
    /**
     * @internal
     */
    public once: boolean = false,
  ) {}
}
