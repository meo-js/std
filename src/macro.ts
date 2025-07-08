/**
 * @public
 *
 * @module
 */
import type * as ccenv from "cc/env";
import * as dev from "compile-constants/dev";
import type { COCOS, NODE } from "compile-constants/env";
import * as flags from "compile-constants/flags";

/**
 * 是否处于调试模式
 *
 * 编译目标为 {@link COCOS} 时，等同于 {@link ccenv.DEBUG}
 *
 * 编译目标为 {@link NODE} 时，等同于 `process.env.NODE_ENV !== "production"`
 *
 * 其余编译目标等同于 `globalThis.MEO_DEBUG`，默认值为 `false`
 */
export const DEBUG = dev.DEBUG;

/**
 * 是否启用新手调试模式
 *
 * 这会提供更多的断言检查和诊断信息以帮助排查问题。
 *
 * 所有编译目标等同于 `{@link DEBUG} && globalThis.MEO_ROOKIE`，默认值为 `false`
 */
export const ROOKIE =
    DEBUG
    && ((<{ MEO_ROOKIE?: boolean }>(<unknown>globalThis)).MEO_ROOKIE ?? false);

/**
 * 是否使用旧版装饰器提案实现
 *
 * 编译目标为 {@link COCOS} 时强制使用旧版装饰器，即 `true`
 *
 * 其余编译目标等同于 `globalThis.MEO_USE_LEGACY_DECORATOR`，默认值为 `false`
 */
// FIXME: 新 decorator 提案普及后移除该 flag
export const USE_LEGACY_DECORATOR = flags.USE_LEGACY_DECORATOR;
