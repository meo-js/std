import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import {
  isDate,
  isDuration,
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isPlainTime,
  isString,
  isZonedDateTime,
} from '../predicate.js';
import {
  _tempTemporalInfo,
  _tempTemporalInfo2,
  isDurationLike,
  resetTemporalInfo,
  toTimeZoneId,
  withCalendar,
  type AssignmentOptions,
  type BigIntTimestamp,
  type CalendarIdLike,
  type CalendarLike,
  type DateInput,
  type DateObject,
  type DateTimeInput,
  type DateTimeLike,
  type DateTimeObject,
  type DateTimeText,
  type DurationInput,
  type DurationLike,
  type DurationObject,
  type DurationText,
  type InstantInput,
  type InstantObject,
  type TemporalInfo,
  type TemporalInfoInput,
  type TemporalTemplate,
  type TemporalText,
  type TimeInput,
  type TimeObject,
  type Timestamp,
  type TimeZoneIdLike,
  type WeekLike,
  type ZonedAssignmentOptions,
  type ZonedDateTimeInput,
  type ZonedDateTimeObject,
} from './shared.js';
import {
  format,
  parse,
  toSingleTemporalInfo,
  type toTemporalInfo,
} from './subtle.js';

// Internal helpers to collapse repeated string-template branches and
// keep all conversions fast and consistent.
function _fromStringWithTemplate<T>(
  text: string,
  tOrOpts: unknown,
  opts: unknown,
  // Re-entry that accepts already-parsed {@link TemporalInfo}.
  reentry: (info: TemporalInfo, opts?: unknown) => T,
  // Direct constructor for native string forms.
  from: (text: string, opts?: unknown) => T,
): T {
  if (isString(tOrOpts)) {
    const info = parse(
      text as TemporalText,
      tOrOpts as TemporalTemplate,
      _tempTemporalInfo,
    ) as TemporalInfo;
    return reentry(info, opts);
  }
  return from(text, tOrOpts);
}

function _instantToUTCDateTime(input: InstantInput | InstantObject) {
  // Convert any epoch/Instant/Date to UTC plain date-time cheaply.
  // Using Temporal API avoids extra allocations beyond the required conversions.
  if (typeof input === 'number') {
    return Temporal.Instant.fromEpochMilliseconds(input)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  }
  if (typeof input === 'bigint') {
    return Temporal.Instant.fromEpochNanoseconds(input)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  }
  if (isInstant(input)) {
    return input.toZonedDateTimeISO('UTC').toPlainDateTime();
  }
  if (isDate(input)) {
    return toTemporalInstant
      .call(input)
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime();
  }
  // ZonedDateTime -> PlainDateTime
  return input.toPlainDateTime();
}

/**
 * 解析输入为 {@link Temporal.Instant}
 *
 * @param input 毫秒（{@link Timestamp}）或纳秒（{@link BigIntTimestamp}）Unix 时间戳；
 * 包含日期时间与时区偏移量的 {@link DateTimeText} 或 {@link TemporalText}；
 * 可用于构造瞬时的对象（{@link ZonedDateTimeInput}、{@link InstantObject}）。
 */
export function toInstant(
  input: InstantInput | ZonedDateTimeInput | DateTimeText | InstantObject,
): Temporal.Instant;
export function toInstant(
  input: TemporalText,
  template: TemporalTemplate,
): Temporal.Instant;
export function toInstant(
  input:
    | InstantInput
    | ZonedDateTimeInput
    | DateTimeText
    | InstantObject
    | TemporalText,
  template?: TemporalTemplate,
): Temporal.Instant {
  switch (typeof input) {
    case 'string': {
      return _fromStringWithTemplate(
        input,
        template,
        undefined,
        // Parsed {@link TemporalInfo} always contains a time zone or offset.
        info => toInstant(info as unknown as ZonedDateTimeInput),
        text => Temporal.Instant.from(text as DateTimeText),
      );
    }

    case 'number': {
      return Temporal.Instant.fromEpochMilliseconds(input);
    }

    case 'bigint': {
      return new Temporal.Instant(input);
    }

    default: {
      if (isInstant(input)) {
        return input;
      }

      if (isZonedDateTime(input)) {
        return input.toInstant();
      }

      if (isDate(input)) {
        return toTemporalInstant.call(input);
      }

      // ZonedDateTimeInput
      return toZonedDateTime(input as ZonedDateTimeInput).toInstant();
    }
  }
}

/**
 * 解析输入为 {@link Temporal.Duration}
 *
 * 如果解析输入后存在缺失的时间日期分量将被视为 `0`。
 *
 * @param input 持续的毫秒（`number`）或纳秒（`bigint`）数；
 * {@link DateTimeText} 或 {@link TemporalText}；
 * 可用于构造持续时间的对象（{@link DurationLike}、{@link DateTimeLike} & {@link WeekLike}、{@link DurationObject}）。
 */
export function toDuration(
  input: DurationInput | DurationText | DurationObject,
): Temporal.Duration;
export function toDuration(
  input: TemporalText,
  template: TemporalTemplate,
): Temporal.Duration;
export function toDuration(
  input: DurationInput | DurationText | DurationObject | TemporalText,
  template?: TemporalTemplate,
): Temporal.Duration {
  switch (typeof input) {
    case 'string': {
      return _fromStringWithTemplate(
        input,
        template,
        undefined,
        info => toDuration(info as unknown as DurationLike),
        text => Temporal.Duration.from(text as DurationText),
      );
    }

    case 'number': {
      return Temporal.Duration.from({ milliseconds: input });
    }

    case 'bigint': {
      const ms = input / BigInt(1e6);

      if (ms > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Input bigint is too large.');
      }

      const ns = Number(input % BigInt(1e6));
      return Temporal.Duration.from({
        milliseconds: Number(ms),
        nanoseconds: ns,
      });
    }

    default: {
      if (isDuration(input)) {
        return input;
      }

      if (isDurationLike(input)) {
        return Temporal.Duration.from(input);
      }

      // Input may be _tempTemporalInfo.
      const info = toSingleTemporalInfo(
        input,
        resetTemporalInfo(_tempTemporalInfo2),
      );
      return Temporal.Duration.from({
        years: info.year,
        months: info.month,
        weeks: info.week,
        days: info.day,
        hours: info.hour,
        minutes: info.minute,
        seconds: info.second,
        milliseconds: info.millisecond,
        microseconds: info.microsecond,
        nanoseconds: info.nanosecond,
      });
    }
  }
}

/**
 * 解析输入为 {@link Temporal.PlainTime}
 *
 * @param input 毫秒（{@link Timestamp}）、纳秒（{@link BigIntTimestamp}）Unix 时间戳、{@link Temporal.Instant}、{@link Date} 视为 `UTC` 时区的挂钟时间；
 * 包含时间的 {@link DateTimeText}（不允许 `Z` 作为时区偏移量）或 {@link TemporalText}；
 * 可用于构造时间的对象（{@link TimeInput}、{@link TimeObject}）。
 * @param opts {@link AssignmentOptions}
 */
export function toTime(
  input: InstantInput | InstantObject | DateTimeText | TimeInput | TimeObject,
  opts?: AssignmentOptions,
): Temporal.PlainTime;
export function toTime(
  input: TemporalText,
  template: TemporalTemplate,
  opts?: AssignmentOptions,
): Temporal.PlainTime;
export function toTime(
  input:
    | InstantInput
    | InstantObject
    | DateTimeText
    | TimeInput
    | TimeObject
    | TemporalText,
  arg2?: TemporalTemplate | AssignmentOptions,
  arg3?: AssignmentOptions,
): Temporal.PlainTime {
  switch (typeof input) {
    case 'number':
    case 'bigint': {
      return toDateTime(input, arg2 as AssignmentOptions).toPlainTime();
    }

    case 'string': {
      return _fromStringWithTemplate(
        input,
        arg2,
        arg3,
        (info, opts) =>
          toTime(info as unknown as TimeInput, opts as AssignmentOptions),
        (text, opts) =>
          Temporal.PlainTime.from(text, opts as AssignmentOptions),
      );
    }

    default: {
      if (isPlainTime(input)) {
        return input;
      }

      if (isInstant(input) || isDate(input)) {
        return toDateTime(input, arg2 as AssignmentOptions).toPlainTime();
      }

      if (isZonedDateTime(input) || isPlainDateTime(input)) {
        return input.toPlainTime();
      }

      return Temporal.PlainTime.from(input, arg2 as AssignmentOptions);
    }
  }
}

/**
 * 解析输入为 {@link Temporal.PlainDate}
 *
 * @param input 毫秒（{@link Timestamp}）、纳秒（{@link BigIntTimestamp}）Unix 时间戳、{@link Temporal.Instant}、{@link Date} 视为 `UTC` 时区的挂钟时间；
 * 包含日期与可选的日历标注的 {@link DateTimeText}（不允许 `Z` 作为时区偏移量）或 {@link TemporalText}；
 * 可用于构造日期的对象（{@link DateTimeInput}、{@link DateTimeObject}）。
 * @param opts {@link AssignmentOptions}
 */
export function toDate(
  input: InstantInput | Exclude<InstantObject, Temporal.ZonedDateTime>,
  opts?: AssignmentOptions & Partial<CalendarLike>,
): Temporal.PlainDate;
export function toDate(
  input:
    | DateTimeText
    | DateInput
    | Exclude<DateObject, InstantObject>
    | Temporal.ZonedDateTime,
  opts?: AssignmentOptions,
): Temporal.PlainDate;
export function toDate(
  input: TemporalText,
  template: TemporalTemplate,
  opts?: AssignmentOptions,
): Temporal.PlainDate;
export function toDate(
  input:
    | InstantInput
    | InstantObject
    | DateTimeText
    | DateInput
    | DateObject
    | TemporalText,
  arg2?: TemporalTemplate | (AssignmentOptions & Partial<CalendarLike>),
  arg3?: AssignmentOptions,
): Temporal.PlainDate {
  switch (typeof input) {
    case 'number':
    case 'bigint': {
      return toDateTime(input, arg2 as AssignmentOptions).toPlainDate();
    }

    case 'string': {
      return _fromStringWithTemplate(
        input,
        arg2,
        arg3,
        (info, opts) =>
          toDate(info as unknown as DateInput, opts as AssignmentOptions),
        (text, opts) =>
          Temporal.PlainDate.from(text, opts as AssignmentOptions),
      );
    }

    default: {
      if (isInstant(input) || isDate(input)) {
        return toDateTime(input, arg2 as AssignmentOptions).toPlainDate();
      }

      if (isZonedDateTime(input) || isPlainDateTime(input)) {
        return input.toPlainDate();
      }

      if (isPlainDate(input)) {
        return input;
      }

      return Temporal.PlainDate.from(input, arg2 as AssignmentOptions);
    }
  }
}

/**
 * 解析输入为 {@link Temporal.PlainDateTime}
 *
 * @param input 毫秒（{@link Timestamp}）、纳秒（{@link BigIntTimestamp}）Unix 时间戳、{@link Temporal.Instant}、{@link Date} 视为 `UTC` 时区的挂钟时间；
 * 包含日期与可选的时间、日历标注的 {@link DateTimeText}（不允许 `Z` 作为时区偏移量）或 {@link TemporalText}；
 * 可用于构造日期时间的对象（{@link DateTimeInput}、{@link DateTimeObject}）。
 * @param opts {@link AssignmentOptions}
 */
export function toDateTime(
  input: InstantInput | Exclude<InstantObject, Temporal.ZonedDateTime>,
  opts?: AssignmentOptions & Partial<CalendarLike>,
): Temporal.PlainDateTime;
export function toDateTime(
  input:
    | DateTimeText
    | DateTimeInput
    | Exclude<DateTimeObject, InstantObject>
    | Temporal.ZonedDateTime,
  opts?: AssignmentOptions,
): Temporal.PlainDateTime;
export function toDateTime(
  input: TemporalText,
  template: TemporalTemplate,
  opts?: AssignmentOptions,
): Temporal.PlainDateTime;
export function toDateTime(
  input:
    | InstantInput
    | InstantObject
    | DateTimeText
    | DateTimeInput
    | DateTimeObject
    | TemporalText,
  arg2?: TemporalTemplate | (AssignmentOptions & Partial<CalendarLike>),
  arg3?: AssignmentOptions,
): Temporal.PlainDateTime {
  switch (typeof input) {
    case 'number':
    case 'bigint': {
      return withCalendar(
        toInstant(input).toZonedDateTimeISO('UTC').toPlainDateTime(),
        (<Partial<CalendarLike> | undefined>arg2)?.calendar,
      );
    }

    case 'string': {
      return _fromStringWithTemplate(
        input,
        arg2,
        arg3,
        (info, opts) =>
          toDateTime(
            info as unknown as DateTimeInput,
            opts as AssignmentOptions,
          ),
        (text, opts) =>
          Temporal.PlainDateTime.from(text, opts as AssignmentOptions),
      );
    }

    default: {
      if (isInstant(input) || isDate(input)) {
        return withCalendar(
          _instantToUTCDateTime(input as InstantInput | Date),
          (<Partial<CalendarLike> | undefined>arg2)?.calendar,
        );
      }

      if (isPlainDate(input) || isZonedDateTime(input)) {
        return input.toPlainDateTime();
      }

      // Handled above with the Instant/Date branch.

      if (isPlainDateTime(input)) {
        return input;
      }

      return Temporal.PlainDateTime.from(input, arg2 as AssignmentOptions);
    }
  }
}

/**
 * 解析输入为 {@link Temporal.ZonedDateTime}
 *
 * @param instant 毫秒（{@link Timestamp}）或纳秒（{@link BigIntTimestamp}）Unix 时间戳；
 * 可用于构造瞬时的对象（{@link InstantObject}）。
 * @param timeZone 时区
 * @param calendar 日历，默认为 `iso8601`
 */
export function toZonedDateTime(
  instant: InstantInput | Exclude<InstantObject, Temporal.ZonedDateTime>,
  timeZone: TimeZoneIdLike,
  calendar?: CalendarIdLike,
): Temporal.ZonedDateTime;
/**
 * @param input 可用于构造时间的对象（{@link DateTimeInput}、{@link DateTimeObject}）。
 * @param timeZone 时区
 * @param opts {@link ZonedAssignmentOptions} & {@link CalendarLike}
 */
export function toZonedDateTime(
  input: DateTimeInput | Temporal.PlainDate | Temporal.PlainDateTime,
  timeZone: TimeZoneIdLike,
  opts?: ZonedAssignmentOptions,
): Temporal.ZonedDateTime;
/**
 * @param input 包含日期与时区标注（其余可选）的 {@link DateTimeText} 或 {@link TemporalText}；
 * 可用于构造时区感知的日期时间的对象（{@link ZonedDateTimeInput}、{@link ZonedDateTimeObject}）。
 * @param opts {@link ZonedAssignmentOptions}
 */
export function toZonedDateTime(
  input: DateTimeText | ZonedDateTimeInput | ZonedDateTimeObject,
  opts?: ZonedAssignmentOptions,
): Temporal.ZonedDateTime;
/**
 * @param input 包含日期与时区标注（其余可选）的 {@link TemporalText}
 * @param template 字符串模板
 * @param opts {@link ZonedAssignmentOptions}
 */
export function toZonedDateTime(
  input: TemporalText,
  template: TemporalTemplate,
  opts?: ZonedAssignmentOptions,
): Temporal.ZonedDateTime;
export function toZonedDateTime(
  input:
    | InstantInput
    | Exclude<InstantObject, Temporal.ZonedDateTime>
    | DateTimeInput
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | DateTimeText
    | ZonedDateTimeInput
    | ZonedDateTimeObject
    | TemporalText,
  arg2?: TimeZoneIdLike | ZonedAssignmentOptions | TemporalTemplate,
  arg3?: CalendarIdLike | ZonedAssignmentOptions,
): Temporal.ZonedDateTime {
  switch (typeof input) {
    case 'number':
    case 'bigint': {
      // Fast path: go through Instant conversion, then attach TZ/Calendar.
      const tz = toTimeZoneId(arg2 as TimeZoneIdLike);
      return withCalendar(
        toInstant(input).toZonedDateTimeISO(tz),
        arg3 as CalendarIdLike | undefined,
      );
    }

    case 'string': {
      return _fromStringWithTemplate(
        input,
        arg2,
        arg3,
        (info, opts) =>
          toZonedDateTime(
            info as unknown as ZonedDateTimeInput,
            opts as ZonedAssignmentOptions,
          ),
        (text, opts) =>
          Temporal.ZonedDateTime.from(text, opts as ZonedAssignmentOptions),
      );
    }

    default: {
      if (isInstant(input)) {
        return withCalendar(
          input.toZonedDateTimeISO(arg2 as TimeZoneIdLike),
          arg3 as CalendarIdLike | undefined,
        );
      }

      if (isZonedDateTime(input)) {
        return input;
      }

      if (isDate(input)) {
        return toZonedDateTime(
          toTemporalInstant.call(input),
          arg2 as TimeZoneIdLike,
          arg3 as CalendarIdLike,
        );
      }

      if (isPlainDate(input)) {
        return input.toZonedDateTime(toTimeZoneId(arg2 as TimeZoneIdLike));
      }

      if (isPlainDateTime(input)) {
        return input.toZonedDateTime(
          toTimeZoneId(arg2 as TimeZoneIdLike),
          arg3 as ZonedAssignmentOptions,
        );
      }

      // TemporalInfoInput or DateTimeInput
      if ((<Partial<TemporalInfo>>input).timeZone != null) {
        return Temporal.ZonedDateTime.from(
          input,
          arg2 as ZonedAssignmentOptions,
        );
      } else {
        return Temporal.PlainDateTime.from(
          input,
          arg3 as ZonedAssignmentOptions,
        ).toZonedDateTime(
          arg2 as TimeZoneIdLike,
          arg3 as ZonedAssignmentOptions,
        );
      }
    }
  }
}

/**
 * 格式化时态输入为指定模板格式的字符串
 *
 * @param input 时态输入，将使用 {@link toTemporalInfo} 转换为时态信息后再进行格式化。
 * @param template 字符串模板
 */
export function toTemporalText(
  input: TemporalInfoInput,
  template: TemporalTemplate,
): string {
  const info = toSingleTemporalInfo(
    input,
    resetTemporalInfo(_tempTemporalInfo),
  );
  return format(info, template);
}

// TODO: toDurationText / toDateTimeText
