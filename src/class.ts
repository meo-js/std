/**
 * @public
 *
 * @module
 */
import { isFunction } from "./predicate.js";
import type { uncertain } from "./ts.js";

/**
 * 类
 *
 * @template T 对象
 * @template Arguments 构造函数参数，默认为 `never`
 * @template Statics 类的静态属性，默认为 `{}`
 */
export type Class<
    T extends object = object,
    Arguments extends readonly unknown[] = uncertain,
    Statics extends object = {},
> = (new (...args: Arguments) => T) & Statics;

/**
 * 抽象类
 *
 * @template T 对象
 * @template Arguments 构造函数参数，默认为 `never`
 * @template Statics 类的静态属性，默认为 `{}`
 */
export type AbstractClass<
    T extends object = object,
    Arguments extends readonly unknown[] = uncertain,
    Statics extends object = {},
> = (abstract new (...args: Arguments) => T) & Statics;

/**
 * 构造函数
 */
export type Constructor<
    T extends object = object,
    Arguments extends readonly unknown[] = uncertain,
> = abstract new (...args: Arguments) => T;

/**
 * 抽象构造函数
 */
export type AbstractConstructor<
    T extends object = object,
    Arguments extends readonly unknown[] = uncertain,
> = abstract new (...args: Arguments) => T;

/**
 * 获取对象的类
 *
 * @param object 对象
 */
export function getClass<T extends object>(object: T): Class<T> {
    return object.constructor as Class<T>;
}

/**
 * 获取类的父类
 *
 * @param targetClass 类
 */
export function getSuperClass<R extends AbstractClass = Class>(
    targetClass: AbstractClass,
): R | undefined {
    const parent = Object.getPrototypeOf(targetClass) as R;
    if (parent === Function.prototype) {
        return undefined;
    } else {
        return parent;
    }
}

/**
 * 获取用于遍历继承链上所有类的迭代器
 *
 * @returns 返回按顺序遍历的迭代器，最后一个元素是根父类
 */
export function* walkClassChain<R extends AbstractClass = Class>(
    target: AbstractClass | object,
    includeSelf: boolean = true,
): Generator<R, void, void> {
    target = isFunction(target) ? target : getClass(target);

    if (includeSelf) {
        yield target as R;
    }

    let parentClass: R | undefined = target as R;
    while ((parentClass = getSuperClass<R>(parentClass))) {
        yield parentClass;
    }
}

/**
 * 获取继承链上所有的类
 *
 * @param target 类
 * @param includeSelf 是否包含自身类，默认 `true`
 * @returns 返回按顺序排列的数组，最后一个元素是根父类
 */
export function getClassChain<R extends AbstractClass = Class>(
    target: AbstractClass | object,
    includeSelf: boolean = true,
): R[] {
    target = isFunction(target) ? target : getClass(target);

    const classes: R[] = [];

    if (includeSelf) {
        classes.push(target as R);
    }

    let parentClass: R | undefined = target as R;
    while ((parentClass = getSuperClass<R>(parentClass))) {
        classes.push(parentClass);
    }
    return classes;
}

/**
 * 获取根级父类
 *
 * @param targetClass 对象类
 */
export function getBaseClass<R extends AbstractClass = Class>(
    targetClass: AbstractClass,
): R {
    let lastClass: AbstractClass | undefined = undefined;
    let parentClass: AbstractClass | undefined = targetClass;
    do {
        lastClass = parentClass;
        parentClass = getSuperClass(parentClass);
    } while (parentClass);
    return lastClass as R;
}

/**
 * 是否为继承链上的子类
 *
 * @param targetClass 子类
 * @param superClass 父类
 * @param includeSelf 两者相等时是否返回 `true`，默认 `true`
 */
export function isSubClass(
    targetClass: AbstractClass,
    superClass: AbstractClass,
    includeSelf: boolean = true,
): boolean {
    if (includeSelf && targetClass === superClass) return true;
    return Object.prototype.isPrototypeOf.call(superClass, targetClass);
}

/**
 * 是否为直接子类
 *
 * @param targetClass 子类
 * @param superClass 父类
 */
export function isExactlySubClass(
    targetClass: AbstractClass,
    superClass: AbstractClass,
): boolean {
    return getSuperClass(targetClass) === superClass;
}
