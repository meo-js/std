/**
 * @public
 * @module
 */
import type { AbstractClass } from './class.js';
import type { fn } from './function.js';
import type { Accessor, Getter, Setter } from './protocol/accessor.js';
import type { uncertain } from './ts.js';

/**
 * 装饰器
 *
 * 所有装饰器接收两个参数：
 * - `target` - 被装饰的值（类字段为 `undefined`）
 * - `context` - 上下文对象
 *
 * 装饰器的执行步骤：
 * 1. 装饰器表达式（@ 之后的部分）与计算属性名一起进行求值
 * 2. 装饰器（作为函数）在类定义期间被调用，在方法被评估之后，但在构造函数和原型被组装之前
 * 3. 装饰器在所有装饰器被调用之后，一次性应用于构造函数和原型（并进行修改）
 *
 * 装饰器的执行顺序：
 * - 同个值的多个装饰器按照从左到右、从上到下的顺序进行
 * - 类装饰器在所有方法和字段装饰器被调用且应用之后才被调用
 * - 最后，静态方法和字段的装饰器被调用和应用
 */
export type Decorator =
  | Decorator.Class
  | Decorator.ClassMethod
  | Decorator.ClassGetter
  | Decorator.ClassSetter
  | Decorator.ClassField
  | Decorator.ClassAccessor;

/**
 * 类字段属性装饰器的返回类型
 */
export type ClassFieldDecoratorResult<
  This = void,
  T = uncertain,
  R = unknown,
> = (this: This, value: T) => R;

export declare namespace Decorator {
  /**
   * 允许装饰的目标类型
   */
  export type Target = AbstractClass | fn | Getter | Setter | Accessor;

  /**
   * 装饰器的返回类型
   */
  export type Result =
    | AbstractClass
    | fn
    | Getter
    | Setter
    | ClassAccessorDecoratorResult<void, unknown>
    | ClassFieldDecoratorResult;

  /**
   * 装饰器种类
   */
  export type Kind =
    | 'class'
    | 'method'
    | 'getter'
    | 'setter'
    | 'field'
    | 'accessor';

  /**
   * 类装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return class extends target {
   *         constructor(...args) {
   *             super(...args);
   *             console.log(`Constructing an instance of \`${name}\` with arguments \`${args.join(", ")}\`.`);
   *         }
   *     }
   * }
   *
   * \@logged
   * class C {}
   *
   * new C(1);
   * // constructing an instance of C with arguments 1.
   * ```
   */
  export type Class<T extends AbstractClass = AbstractClass, R = T> = (
    target: T,
    context: ClassDecoratorContext<T>,
  ) => R | void;

  /**
   * 类方法装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return function (...args) {
   *         const ret = target.call(this, ...args);
   *         console.log(`\`${name}\` has been called.`);
   *         return ret;
   *     };
   * }
   *
   * class C {
   *   \@logged
   *   m(arg) {}
   * }
   *
   * new C().m(1);
   * // log: m has been called.
   * ```
   */
  export type ClassMethod<This = void, T extends fn = fn, R = T> = (
    target: T,
    context: ClassMethodDecoratorContext<This, T>,
  ) => R | void;

  /**
   * 类 `getter` 装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return function (...args) {
   *         const ret = target.call(this, ...args);
   *         console.log(`\`${name}\` has been called.`);
   *         return ret;
   *     };
   * }
   *
   * class C {
   *     \@logged
   *     get m() {}
   * }
   *
   * new C().m;
   * // log: m has been called.
   * ```
   */
  export type ClassGetter<
    This = void,
    T = unknown,
    R extends Getter = Getter,
  > = (
    target: Getter<T, This>,
    context: ClassGetterDecoratorContext<This, T>,
  ) => R | void;

  /**
   * 类 `setter` 装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return function (...args) {
   *         const ret = target.call(this, ...args);
   *         console.log(`\`${name}\` has been called.`);
   *         return ret;
   *     };
   * }
   *
   * class C {
   *     \@logged
   *     set m(value) {}
   * }
   *
   * new C().m = 1;
   * // log: m has been called.
   * ```
   */
  export type ClassSetter<
    This = void,
    T = uncertain,
    R extends Setter = Setter,
  > = (
    target: Setter<T, This>,
    context: ClassSetterDecoratorContext<This, T>,
  ) => R | void;

  /**
   * 类字段装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return function (initialValue) {
   *         console.log(`Initializing \`${name}\` with value \`${initialValue}\`.`);
   *         return initialValue;
   *     };
   * }
   *
   * class C {
   *   \@logged x = 1;
   * }
   *
   * new C();
   * // initializing x with value 1.
   * ```
   */
  export type ClassField<This = void, T = uncertain, R = unknown> = (
    target: undefined,
    context: ClassFieldDecoratorContext<This, T>,
  ) => ClassFieldDecoratorResult<This, T, R> | void;

  /**
   * 类自动访问器装饰器
   *
   * @example 日志记录装饰器
   * ```ts
   * function logged(target, { name }) {
   *     return {
   *         get() {
   *             console.log(`Getting \`${name}\` has been called.`);
   *             return get.call(this);
   *         },
   *
   *         set(val) {
   *         console.log(`Setting \`${name}\` to \`${val}\` has been called.`);
   *             return set.call(this, val);
   *         },
   *
   *         init(initialValue) {
   *         console.log(`Initializing \`${name}\` with value \`${initialValue}\`.`);
   *             return initialValue;
   *         }
   *     };
   * }
   *
   * class C {
   *     \@logged accessor x = 1;
   * }
   * ```
   */
  export type ClassAccessor<This = void, T = uncertain, R = unknown> = (
    target: ClassAccessorDecoratorTarget<This, T>,
    context: ClassAccessorDecoratorContext<This, T>,
  ) => ClassAccessorDecoratorResult<This, R> | void;

  // FIXME: 新 decorator 提案普及后移除以下 Legacy 内容

  /**
   * Legacy 装饰器属性描述符
   */
  export type LegacyDescriptor<T extends object = uncertain> =
    PropertyDescriptor & { initializer?: (this: T) => unknown };

  /**
   * Legacy 装饰器
   *
   * 仅 Babel legacy decorator 有 `descriptor` 属性
   */
  export type Legacy<T extends object = uncertain> = (
    target: T,
    propertyKey: keyof T,
    descriptor?: LegacyDescriptor<T>,
  ) => void;
}
