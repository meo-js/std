/**
 * @public
 *
 * @module
 */
/**
 * 修剪 {@link Map} 所有键或值为 `undefined` 的键值对
 */
export function prune<T extends Map<unknown, unknown>>(v: T): T {
    for (const [key, value] of v) {
        if (key === undefined || value === undefined) {
            v.delete(key);
        }
    }
    return v;
}
