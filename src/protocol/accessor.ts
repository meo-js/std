import type { uncertain } from "../ts/semantic.js";

/**
 * 标准 `getter` 类型
 */
export type Getter<T = unknown, This = void> = (this: This) => T;

/**
 * 标准 `setter` 类型
 */
export type Setter<T = uncertain, This = void> = (this: This, value: T) => void;

/**
 * 标准 `accessor` 对象类型
 */
export type Accessor<T = unknown, TSet = T, This = void> = {
    get(this: This): T;
    set(this: This, value: TSet): void;
};
