import type { Anys } from "../ts/any.js";

/**
 * 类
 *
 * @template T 对象
 * @template Arguments 构造函数参数，默认为 `any[]`
 * @template Statics 类的静态属性，默认为 `{}`
 */
export type Class<
    T extends object = object,
    Arguments extends readonly unknown[] = Anys,
    Statics extends object = {},
> = (new (...args: Arguments) => T) & Statics;

/**
 * 抽象类
 *
 * @template T 对象
 * @template Arguments 构造函数参数，默认为 `any[]`
 * @template Statics 类的静态属性，默认为 `{}`
 */
export type AbstractClass<
    // prettier-keep
    T extends object = object,
    Arguments extends readonly unknown[] = Anys,
    Statics extends object = {},
> = (abstract new (...args: Arguments) => T) & Statics;

/**
 * 类
 *
 * @template T 类
 * @template Instance 构造对象，默认从 {@link T} 中提取
 * @template Statics 类的静态属性，默认从 {@link T} 中提取
 * @template Abstract 是否为抽象类，传入 `unknown` 则默认与传入的类一致
 */
export type ClassOf<
    T extends AbstractConstructor,
    Instance extends object = InstanceType<T>,
    Statics extends object = Omit<T, "prototype">,
    Abstract extends boolean = T extends AbstractConstructor ? true : false,
> = Abstract extends true
    ? AbstractClass<Instance, ConstructorParameters<T>, Statics>
    : Class<Instance, ConstructorParameters<T>, Statics>;

/**
 * 构造函数
 */
export type Constructor<
    T extends object = object,
    Arguments extends readonly unknown[] = Anys,
> = abstract new (...args: Arguments) => T;

/**
 * 抽象构造函数
 */
export type AbstractConstructor<
    T extends object = object,
    Arguments extends readonly unknown[] = Anys,
> = abstract new (...args: Arguments) => T;
