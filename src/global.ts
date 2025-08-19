/**
 * @public
 * @module
 */
import type { RecordObject } from './object.js';
import { isFunction } from './predicate.js';
import type { Literal } from './ts.js';

const global = <
  Partial<Record<typeof key, Map<string, GlobalModule.Options>>> // eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
    & RecordObject<any>
>globalThis;

const key = Symbol.for('@meojs/global-module');
const globalModules = global[key] ?? new Map<string, GlobalModule.Options>();

/**
 * 全局模块
 */
export const GlobalModule = {
  /**
   * 注册一个全局模块
   *
   * 这意味着你能够以 `globalThis.id` 的方式访问该模块。
   *
   * 如果你传入了一个 `getter` 函数，它将在每次模块被导入时调用。
   *
   * @param id 标识符
   * @param module 模块对象或返回模块对象的 `getter` 函数
   * @param opts {@link GlobalModule.Options}
   * @returns 成功返回 `true`，失败返回 `false`
   *
   * @example 基本用法
   * ```ts
   * registerGlobalModule('apc', { val:0 });
   * ```
   * @example 动态模块
   * ```ts
   * registerGlobalModule('apc', () => ({ val: Math.random() }));
   * ```
   * @example 声明类型提示
   * ```ts
   * declare global {
   *     export namespace apc {
   *         export const val: number;
   *     }
   * }
   * ```
   */
  register(
    id: GlobalModule.Id,
    module: object | (() => object),
    opts: GlobalModule.Options = {},
  ): boolean {
    const { force = false, load, fail } = opts;
    const exists = this.has(id);
    if (force || !exists) {
      if (force && exists) {
        const unload = globalModules.get(id)?.unload;
        globalModules.delete(id);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
        delete global[id];
        unload?.(true);
      }
      if (isFunction<() => object>(module)) {
        Object.defineProperty(global, id, {
          get: module,
          configurable: true,
          enumerable: true,
        });
      } else {
        global[id] = module;
      }
      globalModules.set(id, opts);
      load?.();
      return true;
    } else {
      fail?.();
      return false;
    }
  },

  /**
   * 检查全局模块是否存在
   *
   * @param id 标识符
   */
  has(id: GlobalModule.Id): boolean {
    return id in global;
  },

  /**
   * 注销一个全局模块
   *
   * 这将移除通过 `globalThis.id` 访问该模块的能力。
   *
   * @param id 标识符
   * @returns 成功返回 `true`，模块不存在返回 `false`
   *
   * @example 基本用法
   * ```ts
   * unregisterGlobalModule('apc');
   * ```
   */
  unregister(id: GlobalModule.Id): boolean {
    const opts = globalModules.get(id);
    if (opts) {
      globalModules.delete(id);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
      delete global[id];
      opts.unload?.(false);
      return true;
    } else {
      return false;
    }
  },

  /**
   * 导入全局模块
   *
   * @param id 标识符
   * @returns 返回导入的模块对象
   *
   * @example 基本用法
   * ```ts
   * const apc = importGlobalModule('apc');
   * ```
   */
  import<T extends GlobalModule.Id>(
    id: T,
  ): T extends keyof typeof globalThis ? (typeof globalThis)[T] : unknown {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any -- checked.
    return global[id] as any;
  },
};

export declare namespace GlobalModule {
  /**
   * 全局模块标识符的联合类型
   */
  export type Id = Literal<keyof typeof globalThis, string>;

  /**
   * 全局模块注册选项
   */
  export interface Options {
    /**
     * 是否强制注册，不强制且已存在同名模块时则注册失败
     *
     * @default false
     */
    force?: boolean;

    /**
     * 模块注册成功时回调
     */
    load?: () => void;

    /**
     * 模块被注销时回调
     *
     * @param override 是否因强制注册导致被覆盖
     */
    unload?: (override: boolean) => void;

    /**
     * 模块注册失败时回调
     */
    fail?: () => void;
  }
}
