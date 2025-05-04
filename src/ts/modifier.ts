import type { ApplyDefaultOptions } from "type-fest/source/internal/object.js";
import type {
    AbstractClass,
    AbstractConstructor,
    Class,
    Constructor,
} from "../class.js";
import type { fn } from "../function.js";

/**
 * 绑定函数的 `this` 到指定类型
 */
export type SetThis<T extends fn, This> = T extends (
    ...args: infer A
) => infer R
    ? (this: This, ...args: A) => R
    : T;

/**
 * 修改类
 *
 * @template T 类
 * @template Options {@link SetClassOptions}
 */
export type SetClass<
    T extends AbstractConstructor,
    Options extends SetClassOptions = {},
> =
    ApplyDefaultOptions<
        SetClassOptions,
        DefaultSetClassOptions<T>,
        Options
    > extends infer Options extends Required<SetClassOptions>
        ? Options["abstract"] extends true
            ? AbstractClass<
                  Options["instance"],
                  Options["arguments"],
                  Options["statics"]
              >
            : Class<
                  Options["instance"],
                  Options["arguments"],
                  Options["statics"]
              >
        : never;

/**
 * {@link SetClass} 选项
 */
export type SetClassOptions = {
    /**
     * 修改类的实例类型
     */
    readonly instance?: object;

    /**
     * 修改类的构造函数参数
     */
    readonly arguments?: readonly unknown[];

    /**
     * 修改类的静态属性
     */
    readonly statics?: object;

    /**
     * 修改是否为抽象类的标志
     */
    readonly abstract?: boolean;
};

type DefaultSetClassOptions<
    T extends AbstractConstructor,
    Arguments extends readonly unknown[] = ConstructorParameters<T>,
    Instance extends object = InstanceType<T>,
    Statics extends object = Omit<T, "prototype">,
    Abstract extends boolean = T extends Constructor ? false : true,
> = {
    instance: Instance;
    arguments: Arguments;
    statics: Statics;
    abstract: Abstract;
};
