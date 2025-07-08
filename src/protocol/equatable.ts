import { equal } from "./symbols.js";

/**
 * 具有自定义相等判定函数的接口
 */
export interface Equatable {
    /**
     * 返回该对象是否与传入值相等
     */
    [equal](value: unknown): boolean;
}
