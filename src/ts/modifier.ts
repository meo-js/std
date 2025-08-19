/**
 * @public
 * @module
 */
import type {
  AbstractClass,
  AbstractConstructor,
  Class,
  Constructor,
} from '../class.js';
import type { fn } from '../function.js';
import type { ApplyDefaultOptions } from '../ts.js';

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
  SetClassOptions.Applied<T, Options> extends infer Options extends
    SetClassOptions.Result
    ? Options['abstract'] extends true
      ? AbstractClass<
          Options['instance'],
          Options['arguments'],
          Options['statics']
        >
      : Class<Options['instance'], Options['arguments'], Options['statics']>
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

export declare namespace SetClassOptions {
  export interface Default<T extends AbstractConstructor>
    extends SetClassOptions {
    instance: InstanceType<T>;
    arguments: ConstructorParameters<T>;
    statics: Omit<T, 'prototype'>;
    abstract: T extends Constructor ? false : true;
  }
  export type Applied<
    T extends AbstractConstructor,
    Options extends SetClassOptions,
  > = ApplyDefaultOptions<SetClassOptions, Default<T>, Options>;
  export type Result = Required<SetClassOptions>;
}
