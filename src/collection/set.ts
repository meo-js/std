/**
 * @public
 *
 * @module
 */
/**
 * 删除 {@link Set} 所有 `undefined` 的值
 */
export function prune<T extends Set<unknown>>(v: T): T {
    for (const value of v) {
        if (value === undefined) {
            v.delete(value);
        }
    }
    return v;
}
