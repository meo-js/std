import type { Literal } from "../../gymnastic/fix.js";

const key = Symbol.for("@meojs/utils/global-module");
const globalModules =
    (globalThis[key as never] as Map<string, GlobalModuleOptions> | undefined)
    ?? new Map<string, GlobalModuleOptions>();

/**
 * 所有全局模块标识符组成的联合类型
 */
export type GlobalModuleId = Literal<keyof typeof globalThis, string>;

/**
 * 全局模块注册选项
 */
export interface GlobalModuleOptions {
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

/**
 * 注册一个全局模块
 *
 * 这意味着你能够以 `globalThis.id` 的方式访问该模块。
 *
 * 如果你传入了一个 `getter` 函数，它将在每次模块被导入时调用。
 *
 * @param id 标识符
 * @param module 模块对象或返回模块对象的 `getter` 函数
 * @param opts {@link GlobalModuleOptions}
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
export function registerGlobalModule(
    id: GlobalModuleId,
    module: object | (() => object),
    opts: GlobalModuleOptions = {},
): boolean {
    const { force = false, load, fail } = opts;
    const exists = id in globalThis;
    if (force || !exists) {
        if (force && exists) {
            const unload = globalModules.get(id)?.unload;
            globalModules.delete(id);
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
            delete globalThis[id as never];
            unload?.(true);
        }
        globalThis[id as never] = module as never;
        globalModules.set(id, opts);
        load?.();
        return true;
    } else {
        fail?.();
        return false;
    }
}

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
export function importGlobalModule<T extends GlobalModuleId>(
    id: T,
): T extends keyof typeof globalThis ? (typeof globalThis)[T] : unknown {
    return globalThis[id as never];
}

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
export function unregisterGlobalModule(id: GlobalModuleId): boolean {
    const opts = globalModules.get(id);
    if (opts) {
        globalModules.delete(id);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
        delete globalThis[id as never];
        opts.unload?.(false);
        return true;
    } else {
        return false;
    }
}
