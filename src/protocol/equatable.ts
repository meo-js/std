import { equal } from './symbols.js';

/**
 * 具有自定义相等判定函数的接口
 */
export interface Equatable {
  /**
   * 返回该对象是否与传入值相等
   *
   * @param value 要比较的值
   * @param isCompared 用于判断两个对象是否已经比较过且相等的函数，返回 `true` 则表示相等，可以直接返回，`false` 则表示需要继续比较
   */
  [equal](
    value: unknown,
    isCompared: (a: object, b: object) => boolean,
  ): boolean;
}
