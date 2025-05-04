/**
 * @public
 *
 * @module
 */

/**
 * @returns 返回按顺序遍历的迭代器，最后一个元素是根原型
 */
export function* walk<T extends object>(o: object): Generator<T, void, void> {
    let proto: T | null = Object.getPrototypeOf(o) as T | null;
    while (proto != null) {
        yield proto;
        proto = Object.getPrototypeOf(proto) as T | null;
    }
}

/**
 * @returns 返回按顺序排列的数组，最后一个元素是根原型
 */
export function getChain<T extends object>(o: object): T[] {
    const prototypes: T[] = [];
    let proto: T | null = Object.getPrototypeOf(o) as T | null;
    while (proto != null) {
        prototypes.push(proto);
        proto = Object.getPrototypeOf(proto) as T | null;
    }
    return prototypes;
}

/**
 * @returns 返回对象的原型
 */
export function get<T extends object | null>(o: object): T {
    return Object.getPrototypeOf(o) as T;
}

/**
 * 设置对象的原型
 */
export function set(o: object, proto: object | null) {
    Object.setPrototypeOf(o, proto);
}
