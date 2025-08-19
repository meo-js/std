/**
 * @public
 * @module
 */

/**
 * 中位数的舍入策略
 */
export enum Rounding {
  /**
   * 向正无穷大方向舍入。
   */
  HalfUp,

  /**
   * 向负无穷大方向舍入。
   */
  HalfDown,

  /**
   * 向远离零的数舍入。
   */
  AwayFromZero,

  /**
   * 向接近零的数舍入。
   */
  ToZero,

  /**
   * 舍入到最接近的偶数，这也被称为 “银行家舍入”。
   */
  ToEven,
}

const EPSILON = Number.EPSILON;

/**
 * 判断两个数值是否相等
 *
 * 该函数做了以下处理：
 * - `+0` 等于 `-0`。
 * - 对于浮点数进行近似比较。
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果两个数值相等则返回 `true`，否则返回 `false`
 */
export function eq(a: number, b: number): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  const diff = Math.abs(a - b);

  if (diff < EPSILON) {
    return true;
  }

  return diff <= EPSILON * Math.min(Math.abs(a), Math.abs(b));
}

/**
 * 判断两个数值是否不相等
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果两个数值不相等则返回 `true`，否则返回 `false`
 *
 * @see {@link eq}
 */
export function neq(a: number, b: number): boolean {
  return !eq(a, b);
}

/**
 * 判断数值 A 是否大于等于数值 B
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果数值 A 大于等于数值 B 则返回 `true`，否则返回 `false`
 *
 * @see {@link eq}
 */
export function gte(a: number, b: number): boolean {
  if (eq(a, b)) {
    return true;
  }

  return a > b;
}

/**
 * 判断数值 A 是否小于等于数值 B
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果数值 A 小于等于数值 B 则返回 `true`，否则返回 `false`
 *
 * @see {@link eq}
 */
export function lte(a: number, b: number): boolean {
  if (eq(a, b)) {
    return true;
  }

  return a < b;
}

/**
 * 判断数值 A 是否大于数值 B
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果数值 A 大于数值 B 则返回 `true`，否则返回 `false`
 *
 * @see {@link eq}
 */
export function gt(a: number, b: number): boolean {
  if (eq(a, b)) {
    return false;
  }

  return a > b;
}

/**
 * 判断数值 A 是否小于数值 B
 *
 * @param a 数值 A
 * @param b 数值 B
 * @returns 如果数值 A 小于数值 B 则返回 `true`，否则返回 `false`
 *
 * @see {@link eq}
 */
export function lt(a: number, b: number): boolean {
  if (eq(a, b)) {
    return false;
  }

  return a < b;
}

/**
 * 将数值四舍五入到指定的小数位数
 */
export function round(
  value: number,
  decimals = 0,
  rounding: Rounding = Rounding.HalfUp,
) {
  switch (rounding) {
    case Rounding.HalfUp:
      return adjustFloat(value, Math.round, decimals);

    case Rounding.HalfDown:
      return adjustFloat(value, roundHalfDown, decimals);

    case Rounding.AwayFromZero:
      return adjustFloat(value, roundAwayFromZero, decimals);

    case Rounding.ToZero:
      return adjustFloat(value, roundToZero, decimals);

    case Rounding.ToEven:
      return adjustFloat(value, roundToEven, decimals);
  }
}

const roundHalfDown = createMidpointRoundMethod(Math.floor);

const roundAwayFromZero = createMidpointRoundMethod((value, floor) =>
  value >= 0 ? Math.ceil(value) : floor,
);

const roundToZero = createMidpointRoundMethod((value, floor) =>
  value >= 0 ? floor : Math.ceil(value),
);

const roundToEven = createMidpointRoundMethod((value, floor) =>
  floor % 2 === 0 ? floor : Math.ceil(value),
);

function createMidpointRoundMethod(
  method: (value: number, floor: number) => number,
) {
  return (value: number) => {
    const floor = Math.floor(value);
    const diff = Math.abs(value - floor);

    if (eq(diff, 0.5)) {
      return method(value, floor);
    } else {
      return Math.round(value);
    }
  };
}

/**
 * 将数值向上取整到指定的小数位数
 */
export function ceil(value: number, decimals = 0) {
  return adjustFloat(value, Math.ceil, decimals);
}

/**
 * 将数值向下取整到指定的小数位数
 */
export function floor(value: number, decimals = 0) {
  return adjustFloat(value, Math.floor, decimals);
}

/**
 * 将数值截断到指定的小数位数
 */
export function trunc(value: number, decimals = 0) {
  return adjustFloat(value, Math.trunc, decimals);
}

// TODO: 该函数需要有以下测试用例：
// common:
// - 0.0000000052, 2 -> 0
// - NaN, 2 -> NaN
// - Infinity, 2 -> Infinity
// - 151 / 47964, 3 -> 0.003
// floor:
// - 4.27, 2 -> 4.27
// - 1.005, 2 -> 1
// round:
// - 4.27, 2 -> 4.27
// - 1.005, 2 -> 1.01
// - 42.008, 2 -> 42.01
// - 130.795, 2 -> 130.8
// ceil:
// - 4.27, 2 -> 4.27
// - 1.005, 2 -> 1.01
// trunc:
// - 4.27, 2 -> 4.27
// - 1.005, 2 -> 1
// - 99999999999.9999, 4 -> 99999999999.9999
function adjustFloat(
  value: number,
  method:
    | typeof Math.ceil
    | typeof Math.floor
    | typeof Math.round
    | typeof Math.trunc,
  decimals = 0,
) {
  if (!Number.isFinite(value)) {
    return value;
  }
  const [mant, exp] = decomposeFloat(value);
  const [mant2, exp2] = decomposeFloat(method(+`${mant}e${exp + decimals}`));
  return +`${mant2}e${exp2 - decimals}`;
}

function decomposeFloat(value: number): [mant: number, exp: number] {
  const [mant, exp] = value.toExponential().split('e');
  return [+mant, +exp];
}
