import type * as tf from "type-fest";

/**
 * 将类型输出展平
 *
 * 用例：
 * - 将类型输出展平以改进 IDE 中的类型提示
 * - 将接口转换为类型以帮助进行赋值
 */
export type Simplify<T> = tf.Simplify<T>;
