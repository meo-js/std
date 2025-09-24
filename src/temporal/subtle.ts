import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { isDate, isDuration, isInstant } from '../predicate.js';
import type { checked, Mutable, Simplify } from '../ts.js';
import * as iso8601Impl from './impl/iso8601.js';
import * as rfc9557Impl from './impl/rfc9557.js';
import { ensureTemplate } from './impl/tr35.js';
import {
  type BigIntTimestamp,
  type CalendarLike,
  createTemporalInfo,
  type DateLike,
  type DateTimeLike,
  type DateTimeText,
  type DayLike,
  type DurationLike,
  type DurationText,
  type InstantInput,
  type InstantObject,
  isDurationLike,
  isDurationText,
  type MonthCodeLike,
  type MonthLike,
  resetTemporalInfo,
  type TemporalInfo,
  type TemporalInfoInput,
  type TemporalObject,
  type TemporalTemplate,
  type TemporalText,
  type TimeLike,
  type Timestamp,
  type UTCOffsetLike,
  type WeekLike,
  type YearLike,
} from './shared.js';

/**
 * 格式化时态信息为指定模板格式的字符串
 *
 * @param input 时态信息
 * @param template 字符串模板
 */
export function format(
  input: Partial<TemporalInfo>,
  template: TemporalTemplate,
): string {
  return ensureTemplate(template).format(input);
}

/**
 * 解析指定模板格式的字符串为 {@link TemporalInfo}
 */
export function parse(
  text: TemporalText,
  template: TemporalTemplate,
  out?: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  return ensureTemplate(template).parse(
    text,
    out ? resetTemporalInfo(out) : createTemporalInfo(),
  );
}

/**
 * 将多个输入合并为 {@link TemporalInfo} 对象。
 *
 * 规则：
 * - {@link DateTimeText}: 将解析值赋值到相应的属性上。
 * - 毫秒 {@link Timestamp} & 纳秒 {@link BigIntTimestamp} & {@link Temporal.Instant} & {@link Date}: 转为 {@link Temporal.PlainDateTime} 视为挂钟时间。
 * - 其它 {@link TemporalObject} & {@link TemporalInfo}: 将相应的属性直接赋值。
 * - {@link DurationLike}: 将相应的属性直接赋值，没有的属性赋值为 `0`。
 * - 如果同时存在 {@link YearLike} 与 {@link EraYearLike} 属性，则只会保留其中一种，优先保留 {@link YearLike}。
 * - 如果同时存在 {@link MonthLike} 与 {@link MonthCodeLike} 属性，则只会保留其中一种，优先保留 {@link MonthLike}。
 * - 多个输入会像 {@link Object.assign} 函数一样依次将每个输入合并，后面的输入会覆盖前面的输入。
 *
 * 注意：该函数在合并时只是简单地覆盖属性，将不同时区或者日历的输入合并可能会令人困惑且无法得到有意义的结果。
 */
export function toTemporalInfo<T extends TemporalInfoInput[]>(
  ...inputs: T
): {
  [K in keyof MappedObject<T>]: MappedObject<T>[K];
} {
  const out = createTemporalInfo();
  for (const input of inputs) {
    toSingleTemporalInfo(input, out);
  }
  return out as checked;
}

type MappedObject<T extends TemporalInfoInput[]> = T extends [
  infer U extends TemporalInfoInput,
  ...infer R extends TemporalInfoInput[],
]
  ? Mapping<U> & MappedObject<R>
  : {};

type Mapping<T extends TemporalInfoInput, M = InputMap> = Simplify<
  Mutable<
    M extends [infer U, ...infer R]
      ? U extends [infer K, infer S]
        ? T extends K
          ? S
          : Mapping<T, R>
        : 'type is wrong: must be a tuple of tuples'
      : T extends TemporalInfoInput
        ? T
        : never
  >
>;

type InputMap = [
  [DateTimeText, TemporalInfo],
  [
    Timestamp | BigIntTimestamp | Temporal.Instant | Date,
    DateTimeLike & UTCOffsetLike,
  ],
  [Temporal.ZonedDateTime, TemporalInfo],
  [Temporal.Duration | DurationText, DateTimeLike & WeekLike],
  [Temporal.PlainDate, DateLike & CalendarLike],
  [Temporal.PlainTime, TimeLike],
  [Temporal.PlainDateTime, DateTimeLike & CalendarLike],
  [Temporal.PlainMonthDay, MonthCodeLike & DayLike & CalendarLike],
  [Temporal.PlainYearMonth, YearLike & MonthLike & CalendarLike],
];

/**
 * @internal
 */
export function toSingleTemporalInfo(
  input: TemporalInfoInput,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  switch (typeof input) {
    case 'string':
      if (isDurationText(input)) {
        return iso8601Impl.parse(input, out);
      } else {
        return rfc9557Impl.parse(input, out);
      }

    case 'number':
    case 'bigint':
      return _instantToInfo(input, out);

    case 'object': {
      if (isDate(input)) {
        return _instantToInfo(input, out);
      }

      if (isInstant(input)) {
        return _instantToInfo(input, out);
      }

      if (isDuration(input) || isDurationLike(input)) {
        return _durationToInfo(input, out);
      }

      return _dateTimeToInfo(input, out);
    }

    default:
      throw new TypeError(`Unsupported input type: ${typeof input}`);
  }
}

function _instantToInfo(
  input: InstantInput | InstantObject,
  out: Partial<TemporalInfo>,
) {
  let dateTime: Temporal.PlainDateTime;
  const type = typeof input;
  if (type === 'number') {
    dateTime = Temporal.Instant.fromEpochMilliseconds(input as number)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  } else if (type === 'bigint') {
    dateTime = Temporal.Instant.fromEpochNanoseconds(input as bigint)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  } else if (isInstant(input)) {
    dateTime = input.toZonedDateTimeISO('UTC').toPlainDateTime();
  } else if (isDate(input)) {
    dateTime = toTemporalInstant
      .call(input)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  } else {
    dateTime = (<Temporal.ZonedDateTime>input).toPlainDateTime();
  }

  return _dateTimeToInfo(dateTime, out);
}

function _dateTimeToInfo(
  dateTime: Partial<TemporalInfo>,
  out: Partial<TemporalInfo>,
) {
  if (dateTime.year != null) {
    out.year = dateTime.year;
    out.era = undefined;
    out.eraYear = undefined;
  } else if (dateTime.eraYear != null) {
    out.year = undefined;
    out.eraYear = dateTime.eraYear;
    out.era = dateTime.era;
  }

  if (dateTime.month != null) {
    out.month = dateTime.month;
    out.monthCode = undefined;
  } else if (dateTime.monthCode != null) {
    out.month = undefined;
    out.monthCode = dateTime.monthCode;
  }

  if (dateTime.day != null) out.day = dateTime.day;
  if (dateTime.week != null) out.week = dateTime.week;

  if (dateTime.hour != null) {
    out.hour = dateTime.hour;
    out.minute = dateTime.minute;
    out.second = dateTime.second;
    out.millisecond = dateTime.millisecond;
    out.microsecond = dateTime.microsecond;
    out.nanosecond = dateTime.nanosecond;
  }

  if (dateTime.offset != null) out.offset = dateTime.offset;

  if (<keyof Temporal.PlainDate>'calendarId' in dateTime) {
    if ((dateTime as Partial<Temporal.ZonedDateTime>).timeZoneId != null)
      out.timeZone = (dateTime as Temporal.ZonedDateTime).timeZoneId;
    out.calendar = (dateTime as Temporal.ZonedDateTime).calendarId;
  } else {
    if (dateTime.timeZone != null) out.timeZone = dateTime.timeZone;
    if (dateTime.calendar != null) out.calendar = dateTime.calendar;
  }

  return out;
}

function _durationToInfo(
  duration: Temporal.Duration | Partial<DurationLike>,
  out: Partial<TemporalInfo>,
) {
  out.year = duration.years ?? 0;
  out.era = undefined;
  out.eraYear = undefined;
  out.week = duration.weeks ?? 0;
  out.month = duration.months ?? 0;
  out.monthCode = undefined;
  out.day = duration.days ?? 0;
  out.hour = duration.hours ?? 0;
  out.minute = duration.minutes ?? 0;
  out.second = duration.seconds ?? 0;
  out.millisecond = duration.milliseconds ?? 0;
  out.microsecond = duration.microseconds ?? 0;
  out.nanosecond = duration.nanoseconds ?? 0;
  return out;
}
