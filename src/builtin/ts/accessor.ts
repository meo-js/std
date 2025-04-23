import type { Any } from "./any.js";

/**
 * 对象属性 `getter` 类型
 */
export type Getter<T = Any, This = Any> = (this: This) => T;

/**
 * 对象属性 `setter` 类型
 */
export type Setter<T = Any, This = Any> = (this: This, value: T) => void;

/**
 * 标准 `accessor` 对象类型
 */
export type Accessor<T = Any, TSet = T, This = Any> = {
    get(this: This): T;
    set(this: This, value: TSet): void;
};
