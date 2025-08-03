import { Temporal, toTemporalInstant } from "temporal-polyfill";
import {
    isDate,
    isDuration,
    isInstant,
    isPlainDate,
    isPlainDateTime,
    isPlainTime,
    isString,
    isZonedDateTime,
} from "../predicate.js";
import type { checked, Mutable, Simplify } from "../ts.js";
import * as iso8601Impl from "./format/impl/iso8601.js";
import * as rfc9557Impl from "./format/impl/rfc9557.js";
import { getTemplate } from "./format/impl/tr35.js";
import {
    _tempTemporalInfo,
    createTemporalInfo,
    isDurationLike,
    isDurationText,
    toCalendarId,
    toTimeZoneId,
    withCalendar,
    type AssignmentOptions,
    type BigIntTimestamp,
    type CalendarIdLike,
    type CalendarLike,
    type DateInput,
    type DateLike,
    type DateObject,
    type DateTimeInput,
    type DateTimeLike,
    type DateTimeObject,
    type DateTimeText,
    type DayLike,
    type DurationInput,
    type DurationLike,
    type DurationObject,
    type DurationText,
    type EraYearLike,
    type InstantInput,
    type InstantObject,
    type MonthCodeLike,
    type MonthLike,
    type TemporalInfo,
    type TemporalInfoInput,
    type TemporalObject,
    type TemporalTemplate,
    type TemporalText,
    type TimeInput,
    type TimeLike,
    type TimeObject,
    type Timestamp,
    type TimeZoneIdLike,
    type UTCOffsetLike,
    type WeekLike,
    type YearLike,
    type ZonedAssignmentOptions,
    type ZonedDateTimeInput,
    type ZonedDateTimeObject,
} from "./shared.js";

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
        case "string": {
            if (template != null) {
                return toInstant(
                    getTemplate(template).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                );
            } else {
                return Temporal.Instant.from(input as DateTimeText);
            }
        }

        case "number": {
            return Temporal.Instant.fromEpochMilliseconds(input);
        }

        case "bigint": {
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
        case "string": {
            if (template != null) {
                return toDuration(
                    getTemplate(template).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                );
            } else {
                return Temporal.Duration.from(input as DurationText);
            }
        }

        case "number": {
            return Temporal.Duration.from({ milliseconds: input });
        }

        case "bigint": {
            const ms = input / BigInt(1e6);

            if (ms > Number.MAX_SAFE_INTEGER) {
                throw new RangeError("Input bigint is too large.");
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

            const info = toSingleTemporalInfo(input, _tempTemporalInfo);
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
        case "number":
        case "bigint": {
            return toDateTime(input, arg2 as AssignmentOptions).toPlainTime();
        }

        case "string": {
            if (isString(arg2)) {
                return toTime(
                    getTemplate(arg2).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                    arg3,
                );
            } else {
                return Temporal.PlainTime.from(input, arg2);
            }
        }

        default: {
            if (isPlainTime(input)) {
                return input;
            }

            if (isInstant(input) || isDate(input)) {
                return toDateTime(
                    input,
                    arg2 as AssignmentOptions,
                ).toPlainTime();
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
        case "number":
        case "bigint": {
            return toDateTime(input, arg2 as AssignmentOptions).toPlainDate();
        }

        case "string": {
            if (isString(arg2)) {
                return toDate(
                    getTemplate(arg2).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                    arg3,
                );
            } else {
                return Temporal.PlainDate.from(input, arg2);
            }
        }

        default: {
            if (isInstant(input) || isDate(input)) {
                return toDateTime(
                    input,
                    arg2 as AssignmentOptions,
                ).toPlainDate();
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
        case "number":
        case "bigint": {
            return withCalendar(
                toInstant(input).toZonedDateTimeISO("UTC").toPlainDateTime(),
                (<Partial<CalendarLike> | undefined>arg2)?.calendar,
            );
        }

        case "string": {
            if (isString(arg2)) {
                return toDateTime(
                    getTemplate(arg2).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                    arg3,
                );
            } else {
                return Temporal.PlainDateTime.from(input, arg2);
            }
        }

        default: {
            if (isInstant(input)) {
                return withCalendar(
                    input.toZonedDateTimeISO("UTC").toPlainDateTime(),
                    (<Partial<CalendarLike> | undefined>arg2)?.calendar,
                );
            }

            if (isPlainDate(input) || isZonedDateTime(input)) {
                return input.toPlainDateTime();
            }

            if (isDate(input)) {
                return withCalendar(
                    toTemporalInstant
                        .call(input)
                        .toZonedDateTimeISO("UTC")
                        .toPlainDateTime(),
                    (<Partial<CalendarLike> | undefined>arg2)?.calendar,
                );
            }

            if (isPlainDateTime(input)) {
                return input;
            }

            return Temporal.PlainDateTime.from(
                input,
                arg2 as AssignmentOptions,
            );
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
        case "number": {
            return toZonedDateTime(
                Temporal.Instant.fromEpochMilliseconds(input),
                arg2 as TimeZoneIdLike,
                arg3 as CalendarIdLike,
            );
        }

        case "bigint": {
            return new Temporal.ZonedDateTime(
                input,
                toTimeZoneId(arg2 as TimeZoneIdLike),
                toCalendarId(arg3 as CalendarIdLike),
            );
        }

        case "string": {
            if (isString(arg2)) {
                return toZonedDateTime(
                    getTemplate(arg2 as TemporalTemplate).parse(
                        input,
                        _tempTemporalInfo,
                    ) as TemporalInfo,
                    arg3 as ZonedAssignmentOptions,
                );
            } else {
                return Temporal.ZonedDateTime.from(
                    input,
                    arg2 as ZonedAssignmentOptions,
                );
            }
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
                return input.toZonedDateTime(
                    toTimeZoneId(arg2 as TimeZoneIdLike),
                );
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

/**
 * @internal
 */
export function toSingleTemporalInfo(
    input: TemporalInfoInput,
    out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
    switch (typeof input) {
        case "string":
            if (isDurationText(input)) {
                return iso8601Impl.parse(input, out);
            } else {
                return rfc9557Impl.parse(input, out);
            }

        case "number":
        case "bigint":
            return _instantToInfo(input, out);

        case "object": {
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
    return _dateTimeToInfo(toDateTime(input as InstantInput), out);
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

    if (<keyof Temporal.PlainDate>"calendarId" in dateTime) {
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
                : "type is wrong: must be a tuple of tuples"
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
 * 将时态信息格式化为指定模板格式的字符串
 *
 * @param input 时态信息输入，将使用 {@link toTemporalInfo} 转换为时态信息进行格式化。
 * @param template 字符串模板
 */
export function format(
    input: TemporalInfoInput,
    template: TemporalTemplate,
): string {
    const info = toSingleTemporalInfo(input, _tempTemporalInfo);
    return getTemplate(template).format(info);
}

/**
 * 解析指定模板格式的字符串为 {@link TemporalInfo}
 */
export function parse(
    text: TemporalText,
    template: TemporalTemplate,
): Partial<TemporalInfo> {
    return getTemplate(template).parse(text, createTemporalInfo());
}
