/**
 * @public
 *
 * @module
 */

/**
 * 生成器值类型
 */
export type ValueOf<T extends AsyncGenerator | Generator> =
    T extends AsyncGenerator<infer R>
        ? R
        : T extends Generator<infer R2>
          ? R2
          : never;

/**
 * 生成器返回值类型
 */
export type ReturnOf<T extends AsyncGenerator | Generator> =
    T extends AsyncGenerator<infer _, infer R>
        ? R
        : T extends Generator<infer _, infer R2>
          ? R2
          : never;

/**
 * 生成器 {@link Generator.next} 参数类型
 */
export type SendOf<T extends AsyncGenerator | Generator> =
    T extends AsyncGenerator<infer _, infer R, infer N>
        ? R
        : T extends Generator<infer _, infer R2, infer N2>
          ? R2
          : never;
