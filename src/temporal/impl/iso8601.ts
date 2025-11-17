/**
 * @internal
 * @module
 */
import type { TemporalInfo } from '../shared.js';
// from https://github.com/js-temporal/temporal-polyfill/blob/main/lib/regex.ts

const fraction = /(\d+)(?:[.,](\d{1,9}))?/u;

const durationDate = /(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/u;
const durationTime = new RegExp(
  `(?:${fraction.source}H)?(?:${fraction.source}M)?(?:${fraction.source}S)?`,
  'u',
);
const duration = new RegExp(
  `^([+-])?P${durationDate.source}(?:T(?!$)${durationTime.source})?$`,
  'iu',
);

function rejectDuration(
  y: number,
  mon: number,
  w: number,
  d: number,
  h: number,
  min: number,
  s: number,
  ms: number,
  µs: number,
  ns: number,
) {
  let sign: -1 | 0 | 1 = 0;

  sign = rejectDifferentSign(y, sign);
  sign = rejectDifferentSign(mon, sign);
  sign = rejectDifferentSign(w, sign);
  sign = rejectDifferentSign(d, sign);
  sign = rejectDifferentSign(h, sign);
  sign = rejectDifferentSign(min, sign);
  sign = rejectDifferentSign(s, sign);
  sign = rejectDifferentSign(ms, sign);
  sign = rejectDifferentSign(µs, sign);
  sign = rejectDifferentSign(ns, sign);

  if (
    Math.abs(y) >= 2 ** 32
    || Math.abs(mon) >= 2 ** 32
    || Math.abs(w) >= 2 ** 32
  ) {
    throw new RangeError('years, months, and weeks must be < 2³².');
  }

  const msResult = truncatingDivModByPowerOf10(ms, 3);
  const µsResult = truncatingDivModByPowerOf10(µs, 6);
  const nsResult = truncatingDivModByPowerOf10(ns, 9);
  const remainderSec = truncatingDivModByPowerOf10(
    msResult.mod * 1e6 + µsResult.mod * 1e3 + nsResult.mod,
    9,
  ).div;
  const totalSec =
    d * 86400
    + h * 3600
    + min * 60
    + s
    + msResult.div
    + µsResult.div
    + nsResult.div
    + remainderSec;
  if (!Number.isSafeInteger(totalSec)) {
    throw new RangeError(
      'Total of duration time units can not exceed 9007199254740991.999999999s.',
    );
  }
}

function truncatingDivModByPowerOf10(xParam: number, p: number) {
  let x = xParam;
  if (x === 0) return { div: x, mod: x }; // preserves signed zero

  const sign = Math.sign(x);
  x = Math.abs(x);

  const xDigits = Math.trunc(1 + Math.log10(x));
  if (p >= xDigits) return { div: sign * 0, mod: sign * x };
  if (p === 0) return { div: sign * x, mod: sign * 0 };

  // would perform nearest rounding if x was not an integer:
  const xStr = x.toPrecision(xDigits);
  const div = sign * Number.parseInt(xStr.slice(0, xDigits - p), 10);
  const mod = sign * Number.parseInt(xStr.slice(xDigits - p), 10);

  return { div, mod };
}

function rejectDifferentSign(prop: number, sign: -1 | 0 | 1): -1 | 0 | 1 {
  if (prop === Infinity || prop === -Infinity)
    throw new RangeError('Infinite values not allowed as duration fields.');
  if (prop !== 0) {
    const _prop = prop < 0 ? -1 : 1;
    if (sign !== 0 && _prop !== sign)
      throw new RangeError('Mixed-sign values not allowed as duration fields.');
    return _prop;
  }
  return sign;
}

function throwDurationError(text: string): never {
  throw new RangeError(`Invalid ISO 8601 duration string: ${text}.`);
}

function throwFractionalError(): never {
  throw new RangeError('Only the smallest unit can be fractional.');
}

function toIntegerWithTruncation(value: unknown): number {
  const number = Number(value);
  if (number === 0) return 0;
  if (Number.isNaN(number) || number === Infinity || number === -Infinity) {
    throw new RangeError('Invalid number value.');
  }
  const integer = Math.trunc(number);
  if (integer === 0) return 0; // ℝ(value) in spec text; converts -0 to 0
  return integer;
}

export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  const match = duration.exec(text);
  if (!match) {
    throwDurationError(text);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
  if (match.every((part, i) => i < 2 || part === undefined)) {
    throwDurationError(text);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const years =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    match[2] === undefined ? 0 : toIntegerWithTruncation(match[2]) * sign;
  const months =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    match[3] === undefined ? 0 : toIntegerWithTruncation(match[3]) * sign;
  const weeks =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    match[4] === undefined ? 0 : toIntegerWithTruncation(match[4]) * sign;
  const days =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    match[5] === undefined ? 0 : toIntegerWithTruncation(match[5]) * sign;
  const hours =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    match[6] === undefined ? 0 : toIntegerWithTruncation(match[6]) * sign;
  const fHours = match[7];
  const minutesStr = match[8];
  const fMinutes = match[9];
  const secondsStr = match[10];
  const fSeconds = match[11];
  let minutes = 0;
  let seconds = 0;
  // fractional hours, minutes, or seconds, expressed in whole nanoseconds:
  let excessNanoseconds = 0;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
  if (fHours !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    if (minutesStr ?? fMinutes ?? secondsStr ?? fSeconds ?? false) {
      throwFractionalError();
    }
    excessNanoseconds =
      toIntegerWithTruncation(`${fHours}000000000`.slice(0, 9)) * 3600 * sign;
  } else {
    minutes =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
      minutesStr === undefined ? 0 : toIntegerWithTruncation(minutesStr) * sign;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    if (fMinutes !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
      if (secondsStr ?? fSeconds ?? false) {
        throwFractionalError();
      }
      excessNanoseconds =
        toIntegerWithTruncation(`${fMinutes}000000000`.slice(0, 9)) * 60 * sign;
    } else {
      seconds =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        secondsStr === undefined
          ? 0
          : toIntegerWithTruncation(secondsStr) * sign;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
      if (fSeconds !== undefined) {
        excessNanoseconds =
          toIntegerWithTruncation(`${fSeconds}000000000`.slice(0, 9)) * sign;
      }
    }
  }

  const nanoseconds = excessNanoseconds % 1000;
  const microseconds = Math.trunc(excessNanoseconds / 1000) % 1000;
  const milliseconds = Math.trunc(excessNanoseconds / 1e6) % 1000;
  seconds += Math.trunc(excessNanoseconds / 1e9) % 60;
  minutes += Math.trunc(excessNanoseconds / 60e9);

  rejectDuration(
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    microseconds,
    nanoseconds,
  );

  out.year = years;
  out.era = undefined;
  out.eraYear = undefined;
  out.month = months;
  out.monthCode = undefined;
  out.week = weeks;
  out.day = days;
  out.hour = hours;
  out.minute = minutes;
  out.second = seconds;
  out.millisecond = milliseconds;
  out.microsecond = microseconds;
  out.nanosecond = nanoseconds;

  return out;
}
