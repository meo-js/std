import type { Temporal } from 'temporal-polyfill';
import * as convert from '../convert.js';
import * as impl from '../impl/iso8601.js';
import {
  createTemporalInfo,
  type DurationInput,
  type DurationObject,
  type DurationText,
  type TemporalInfo,
} from '../shared.js';

/**
 * 解析字符串为 {@link TemporalInfo}。
 */
export function parse(input: string): Partial<TemporalInfo> {
  return impl.parse(input, createTemporalInfo());
}

/**
 * 格式化持续时间输入为字符串。
 *
 * @param input 输入数据
 * @param opts {@link Temporal.ToStringPrecisionOptions}
 */
export function format(
  input: DurationInput | DurationText | DurationObject,
  opts?: Temporal.ToStringPrecisionOptions,
): string {
  return convert.toDuration(input).toString(opts);
}

/**
 * 解析字符串为 {@link Temporal.Duration}。
 */
export function toDuration(input: DurationText): Temporal.Duration {
  return convert.toDuration(input);
}
