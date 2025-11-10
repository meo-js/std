import type { fn } from '../function.js';
import type { Poolable } from '../protocol.js';
import { recycle, reuse } from '../protocol/symbols.js';
import type { checked, uncertain } from '../ts.js';

/**
 * 事件监听器
 */
export class EventListener<Arguments extends readonly unknown[] = uncertain>
  implements Poolable
{
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

  /**
   * @internal
   */
  call(args: Arguments) {
    try {
      this.callback.apply(this.thisArg, args as checked);
    } catch (err) {
      reportError(err);
    }
  }

  /**
   * @inheritdoc
   */
  [reuse](
    callback: fn<Arguments>,
    thisArg: unknown = undefined,
    once: boolean = false,
  ) {
    this.callback = callback;
    this.thisArg = thisArg;
    this.once = once;
  }

  /**
   * @inheritdoc
   */
  [recycle]() {
    this.callback = undefined!;
    this.thisArg = undefined;
  }
}
