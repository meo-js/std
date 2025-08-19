/**
 * Class utilities.
 *
 * @public
 * @module
 */
import { isFunction } from './predicate.js';
import type { uncertain } from './ts.js';

/**
 * Represents a Class.
 *
 * @template T The instance object type.
 * @template Arguments The constructor arguments. Default is `uncertain`.
 * @template Statics The static properties of the class. Default is `{}`.
 */
export type Class<
  T extends object = object,
  Arguments extends readonly unknown[] = uncertain,
  Statics extends object = {},
> = (new (...args: Arguments) => T) & Statics;

/**
 * Represents an Abstract class.
 *
 * @template T The instance object type.
 * @template Arguments The constructor arguments. Default is `uncertain`.
 * @template Statics The static properties of the class. Default is `{}`.
 */
export type AbstractClass<
  T extends object = object,
  Arguments extends readonly unknown[] = uncertain,
  Statics extends object = {},
> = (abstract new (...args: Arguments) => T) & Statics;

/**
 * Represents a Constructor.
 *
 * @template T The instance object type.
 * @template Arguments The constructor arguments. Default is `uncertain`.
 */
export type Constructor<
  T extends object = object,
  Arguments extends readonly unknown[] = uncertain,
> = new (...args: Arguments) => T;

/**
 * Represents an Abstract constructor.
 *
 * @template T The instance object type.
 * @template Arguments The constructor arguments. Default is `uncertain`.
 */
export type AbstractConstructor<
  T extends object = object,
  Arguments extends readonly unknown[] = uncertain,
> = abstract new (...args: Arguments) => T;

/**
 * Get the class of an object.
 *
 * @param object The object instance.
 * @returns The class of the object.
 */
export function getClass<T extends object>(object: T): Class<T> {
  return object.constructor as Class<T>;
}

/**
 * Get the superclass of a class.
 *
 * @param targetClass The class to inspect.
 * @returns The parent class, or `undefined` if there is no superclass.
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
 * Walk the class inheritance chain and yield each class.
 *
 * @param target The class or object instance to traverse.
 * @param includeSelf Whether to include the target class itself. Default is `true`.
 * @returns A generator yielding each class in the inheritance chain.
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
 * Get the class inheritance chain as an array.
 *
 * @param target The class or object instance to traverse.
 * @param includeSelf Whether to include the target class itself. Default is `true`.
 * @returns An array of classes from the target up to the root superclass.
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
 * Get the root superclass in the inheritance chain.
 *
 * @param targetClass The class to inspect.
 * @returns The root superclass.
 */
export function getBaseClass<R extends AbstractClass = Class>(
  targetClass: AbstractClass,
): R {
  let currentClass: AbstractClass | undefined = undefined;
  let nextClass: AbstractClass | undefined = targetClass;
  do {
    currentClass = nextClass;
    nextClass = getSuperClass(nextClass);
  } while (nextClass);
  return currentClass as R;
}

/**
 * Determine if a class is a subclass in the inheritance chain.
 *
 * @param targetClass The subclass to test.
 * @param superClass The superclass to compare against.
 * @param includeSelf Whether to return `true` if both classes are equal. Default is `true`.
 * @returns `true` if `targetClass` is a subclass of `superClass`, otherwise `false`.
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
 * Determine if a class is a direct subclass.
 *
 * @param targetClass The subclass constructor to test.
 * @param superClass The superclass constructor to compare against.
 * @returns `true` if {@link targetClass} directly extends {@link superClass}, otherwise `false`.
 */
export function isDirectSubClass(
  targetClass: AbstractClass,
  superClass: AbstractClass,
): boolean {
  return getSuperClass(targetClass) === superClass;
}
