import type { Anys, none } from "./fix.js";
import type { UnionToIntersection } from "./union.js";

/**
 * 描述对象类类型
 *
 * @param TObject 对象
 * @param TParams 可选，构造函数参数
 * @param TStatic 可选，提供一个对象用于描述类的静态属性
 * @param TAbstract 可选，是否为抽象类，默认 `false`
 */
export type Class<
    // prettier-keep
    TObject = object,
    TParams extends Anys = Anys,
    TStatic extends object = {},
    TAbstract extends boolean = false,
> =
    // prettier-keep
    TAbstract extends true
        ? // prettier-keep
          (abstract new (...args: TParams) => TObject) & TStatic
        : (new (...args: TParams) => TObject) & TStatic;

/**
 * 描述抽象对象类类型
 *
 * @param TObject 对象
 * @param TParams 可选，构造函数参数
 * @param TStatic 可选，提供一个对象用于描述类的静态属性
 */
export type AbstractClass<
    // prettier-keep
    TObject = object,
    TParams extends Anys = Anys,
    TStatic extends object = {},
> = Class<TObject, TParams, TStatic, true>;

/**
 * 描述对象类类型
 *
 * @param TClass 对象类
 * @param TObject 可选，目标对象，利于描述泛型对象类
 * @param TStatic 可选，提供一个对象用于描述类的静态属性
 * @param TAbstract 可选，是否为抽象类，传入 `unknown` 则默认与传入的类一致
 */
export type ClassType<
    // prettier-keep
    TClass extends abstract new (...args: any[]) => unknown,
    TObject = none,
    TStatic extends object = Omit<TClass, "prototype">,
    TAbstract = unknown,
> =
    // prettier-keep
    TClass extends new (...args: infer TParams) => infer TObj
        ? // prettier-keep
          Class<
              TObject extends none ? TObj : TObject,
              TParams,
              TStatic,
              TAbstract extends boolean ? TAbstract : false
          >
        : TClass extends abstract new (...args: infer TParams) => infer TObj
          ? Class<
                TObject extends none ? TObj : TObject,
                TParams,
                TStatic,
                TAbstract extends boolean ? TAbstract : true
            >
          : Class<
                object,
                Anys,
                TStatic,
                TAbstract extends boolean ? TAbstract : false
            >;

/**
 * 类数组转为所有类实例的交集
 */
export type ClassesToObjects<T extends AbstractClass[]> =
    // prettier-keep
    T[number] extends AbstractClass<infer TObject>
        ? // prettier-keep
          UnionToIntersection<TObject>
        : object;

/**
 * 类数组转为所有类静态属性对象的交集
 */
export type ClassesToStatics<T extends AbstractClass[]> =
    // prettier-keep
    T[number] extends AbstractClass<infer _, infer __, infer TStatic>
        ? // prettier-keep
          UnionToIntersection<{ [key in keyof TStatic]: TStatic[key] }>
        : object;

/**
 * 类数组转为所有类构造函数参数的交集
 */
export type ClassesToConstructorParams<T extends AbstractClass[]> = {
    [key in keyof T]: T[key] extends AbstractClass<
        infer TObject,
        infer TParams,
        infer TStatic
    >
        ? TParams
        : [];
};

/**
 * 类数组转为并集类型
 */
export type ClassesToInstanceUnion<TArr extends AbstractClass[]> = InstanceType<
    TArr[number]
>;
