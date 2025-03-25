const key = Symbol.for("@meojs/utils/global-singleton");
const instances =
    (globalThis[key as never] as Set<string> | undefined) ?? new Set<string>();

/**
 * 确保标识符是全局单例
 *
 * 调用该函数即会注册标识符，所以之后的调用均会返回 `false`。
 *
 * @param id 标识符
 * @returns 单例返回 `true`，否则返回 `false`
 */
export function ensureSingletonId(id: string) {
    if (instances.has(id)) {
        return false;
    } else {
        instances.add(id);
        return true;
    }
}

/**
 * 注销单例标识符
 *
 * 调用该函数会从全局注册表中移除对应标识符。
 *
 * @param id 标识符
 */
export function releaseSingletonId(id: string) {
    instances.delete(id);
}
