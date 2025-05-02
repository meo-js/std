/**
 * @public
 *
 * @module
 */

/**
 * 生成器值类型
 */
export type GeneratorValue<T extends Generator> =
    T extends Generator<infer R> ? R : never;

/**
 * 生成器返回值类型
 */
export type GeneratorReturnType<T extends Generator> =
    T extends Generator<infer _, infer R> ? R : never;

/**
 * 异步生成器值类型
 */
export type AsyncGeneratorValue<T extends AsyncGenerator | Generator> =
    T extends AsyncGenerator<infer R>
        ? R
        : T extends Generator<infer R2>
          ? R2
          : never;

/**
 * 异步生成器返回值类型
 */
export type AsyncGeneratorReturnType<T extends AsyncGenerator | Generator> =
    T extends AsyncGenerator<infer _, infer R>
        ? R
        : T extends Generator<infer _, infer R2>
          ? R2
          : never;
