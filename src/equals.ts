/**
 * @public
 *
 * @module
 */
// TODO
// ref equals: is, === 等原生方法
// shallow structural equals: TODO
// deep structural equals: TODO
// hashization: TODO
// custom structural(order, ctor): TODO
import { isObjectLike } from "./predicate.js";
import type { Equatable } from "./protocol.js";
import { equal } from "./protocol/symbols.js";

/**
 * 返回两个值是否相等
 *
 * 若其中一个值是实现了 {@link Equatable} 接口的对象则使用自定义比较函数，否则使用 {@link Object.is} 进行判定
 */
export function equals(a: unknown, b: unknown): boolean {
    if (isObjectLike(a)) {
        const _equal = (<Partial<Equatable>>a)[equal];
        if (_equal) {
            return _equal.call(a, b);
        }
    }
    if (isObjectLike(b)) {
        const _equal = (<Partial<Equatable>>b)[equal];
        if (_equal) {
            return _equal.call(b, a);
        }
    }
    return Object.is(a, b);
}
