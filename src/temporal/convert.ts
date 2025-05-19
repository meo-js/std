import { Temporal, toTemporalInstant } from "temporal-polyfill";
import { HAS_BIGINT } from "../env.js";
import type { OmitKey, RequireLeastOneKey } from "../object.js";
import {
    isDate,
    isInstant,
    isPlainDate,
    isPlainDateTime,
    isPlainMonthDay,
    isPlainTime,
    isString,
    isTemporalObject,
    isZonedDateTime,
} from "../predicate.js";
import type { checked, Mutable, Simplify } from "../ts.js";
import {
    createRfc9557ParseResult,
    parseDateTime,
    type RFC9557ParseResult,
} from "./parser/temporal.js";
import {
    isTemporalTextInput,
    toCalendarId,
    toTimeZoneId,
    type AssignmentOptions,
    type BigIntTimestamp,
    type CalendarId,
    type CalendarIdLike,
    type DateInput,
    type DateLike,
    type DateTemporal,
    type DateTimeInfo,
    type DateTimeInfoInput,
    type DateTimeInput,
    type DateTimeLike,
    type DateTimeTemporal,
    type DayLike,
    type DurationInput,
    type DurationLike,
    type DurationText,
    type EraYearLike,
    type InstantLike,
    type MonthCodeLike,
    type MonthLike,
    type Rfc9557Text,
    type TemporalObject,
    type TemporalTextInput,
    type TimeInput,
    type TimeLike,
    type Timestamp,
    type TimeTemporal,
    type TimeZoneId,
    type TimeZoneIdLike,
    type YearLike,
    type ZonedAssignmentOptions,
    type ZonedDateTimeInput,
    type ZonedDateTimeTemporal,
} from "./shared.js";

/**
 * 解析输入为 {@link Temporal.Instant}
 *
 * @param input 以毫秒 {@link Timestamp}、纳秒 {@link BigIntTimestamp} 为单位的 Unix 时间戳；包含日期时间与时区偏移量（其余将被忽略）的 RFC 9557 规范字符串；{@link Temporal.Instant}、{@link Temporal.ZonedDateTime}、{@link Date} 对象
 */
export function toInstant(
    input: InstantLike | Rfc9557Text | Temporal.ZonedDateTime,
) {
    const type = typeof input;

    switch (type) {
        case "string": {
            return Temporal.Instant.from(input as Rfc9557Text);
        }

        case "number": {
            return Temporal.Instant.fromEpochMilliseconds(input as Timestamp);
        }

        case "bigint": {
            return new Temporal.Instant(input as BigIntTimestamp);
        }

        default: {
            if (isInstant(input)) {
                return input;
            } else if (isDate(input)) {
                return toTemporalInstant.call(input);
            } else {
                return (<Temporal.ZonedDateTime>input).toInstant();
            }
        }
    }
}

/**
 * 解析输入为 {@link Temporal.Duration}
 *
 * @param input ISO 8601 规范持续时间字符串；以毫秒 {@link Timestamp}、纳秒 {@link BigIntTimestamp} 为单位的 Unix 时间戳；{@link Temporal.Instant}、{@link Date} 对象；包含时间日期分量的对象，缺失的分量被视为 `0`
 */
export function toDuration(input: InstantLike | DurationText | DurationInput) {
    const type = typeof input;
    switch (type) {
        case "string": {
            return Temporal.Duration.from(input as DurationText);
        }

        case "number": {
            return Temporal.Duration.from({ milliseconds: input as Timestamp });
        }

        case "bigint": {
            const ms = Number(<BigIntTimestamp>input / BigInt(1e6));
            const ns = Number(<BigIntTimestamp>input % BigInt(1e6));
            return Temporal.Duration.from({
                milliseconds: ms,
                nanoseconds: ns,
            });
        }

        default: {
            if (isInstant(input)) {
                if (HAS_BIGINT) {
                    return toDuration(input.epochNanoseconds);
                } else {
                    return toDuration(input.epochMilliseconds);
                }
            } else if (isDate(input)) {
                return toDuration(input.getTime());
            } else {
                const obj = input as RequireLeastOneKey<DateTimeLike>;
                const {
                    years = obj.year,
                    months = obj.month,
                    weeks,
                    days = obj.day,
                    hours = obj.hour,
                    minutes = obj.minute,
                    seconds = obj.second,
                    milliseconds = obj.millisecond,
                    microseconds = obj.microsecond,
                    nanoseconds = obj.nanosecond,
                } = input as RequireLeastOneKey<DurationLike>;

                return Temporal.Duration.from({
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
                });
            }
        }
    }
}

/**
 * 解析输入为 {@link Temporal.PlainDate}
 *
 * @param input 包含日期与可选的日历标注（其余将被忽略）的 RFC 9557 规范字符串或对象
 * @param opts {@link AssignmentOptions}
 */
export function toDate(
    input: Rfc9557Text | DateInput | DateTemporal,
    opts?: AssignmentOptions,
) {
    return Temporal.PlainDate.from(input, opts);
}

/**
 * 解析输入为 {@link Temporal.PlainTime}
 *
 * @param input 包含时间（其余将被忽略）的 RFC 9557 规范字符串或对象
 * @param opts {@link AssignmentOptions}
 */
export function toTime(
    input: Rfc9557Text | TimeInput | TimeTemporal,
    opts?: AssignmentOptions,
) {
    return Temporal.PlainTime.from(input, opts);
}

/**
 * 解析输入为 {@link Temporal.PlainDateTime}
 *
 * @param input 包含日期与可选的时间、日历标注（其余将被忽略）的 RFC 9557 规范字符串或对象
 * @param opts {@link AssignmentOptions}
 */
export function toDateTime(
    input: Rfc9557Text | DateTimeInput | DateTimeTemporal,
    opts?: AssignmentOptions,
) {
    return Temporal.PlainDateTime.from(input, opts);
}

/**
 * 将时间戳转换为 {@link Temporal.ZonedDateTime}
 *
 * @param instant 以毫秒 {@link Timestamp}、纳秒 {@link BigIntTimestamp} 为单位的 Unix 时间戳；{@link Temporal.Instant}、{@link Date} 对象
 * @param timeZone 时区
 * @param calendar 日历，默认为 `iso8601`
 */
export function toZonedDateTime(
    instant: InstantLike,
    timeZone: TimeZoneIdLike,
    calendar?: CalendarIdLike,
): Temporal.ZonedDateTime;
/**
 * 解析输入为 {@link Temporal.ZonedDateTime}
 *
 * @param input 包含日期与时区标注（其余可选）的 RFC 9557 规范字符串或对象
 * @param opts {@link ZonedAssignmentOptions}
 */
export function toZonedDateTime(
    input: Rfc9557Text | ZonedDateTimeInput | ZonedDateTimeTemporal,
    opts?: ZonedAssignmentOptions,
): Temporal.ZonedDateTime;
export function toZonedDateTime(
    arg1:
        | InstantLike
        | Rfc9557Text
        | ZonedDateTimeInput
        | ZonedDateTimeTemporal,
    arg2?: TimeZoneIdLike | ZonedAssignmentOptions,
    calendar?: CalendarIdLike,
): Temporal.ZonedDateTime;
export function toZonedDateTime(
    arg1:
        | InstantLike
        | Rfc9557Text
        | ZonedDateTimeInput
        | ZonedDateTimeTemporal,
    arg2?: TimeZoneIdLike | ZonedAssignmentOptions,
    calendar?: CalendarIdLike,
) {
    const type = typeof arg1;

    switch (type) {
        case "number": {
            let dateTime = Temporal.Instant.fromEpochMilliseconds(
                arg1 as Timestamp,
            ).toZonedDateTimeISO(arg2 as TimeZoneIdLike);
            if (calendar != null) {
                dateTime = dateTime.withCalendar(calendar);
            }
            return dateTime;
        }

        case "bigint": {
            return new Temporal.ZonedDateTime(
                arg1 as BigIntTimestamp,
                toTimeZoneId(arg2 as TimeZoneIdLike),
                toCalendarId(calendar),
            );
        }

        case "string": {
            return Temporal.ZonedDateTime.from(
                arg1 as Rfc9557Text,
                arg2 as ZonedAssignmentOptions,
            );
        }

        default: {
            if (isInstant(arg1)) {
                let dateTime = arg1.toZonedDateTimeISO(arg2 as TimeZoneIdLike);
                if (calendar != null) {
                    dateTime = dateTime.withCalendar(calendar);
                }
                return dateTime;
            } else if (isDate(arg1)) {
                return toZonedDateTime(
                    toInstant(arg1),
                    arg2 as TimeZoneIdLike,
                    calendar,
                );
            } else {
                return Temporal.ZonedDateTime.from(
                    arg1 as ZonedDateTimeInput | ZonedDateTimeTemporal,
                    arg2 as ZonedAssignmentOptions,
                );
            }
        }
    }
}

/**
 * 解析输入为 {@link DateTimeInfo}
 *
 * 解析规则：
 * - {@link Rfc9557Text}: 将每个分量直接赋值到 {@link DateTimeInfo} 对象上。
 * - {@link InstantLike}: 全部作为 "UTC" 时区与 "iso8601" 日历进行解析。
 * - {@link TemporalObject} & {@link DateTimeInfoInput}: 将每个属性直接赋值到 {@link DateTimeInfo} 对象上。
 */
export function toDateTimeInfo<T extends _ToDateTimeInfoInput>(
    input: T,
): { [K in keyof _ToDateTimeInfo<T>]: _ToDateTimeInfo<T>[K] } {
    const info = _createDateTimeInfo();
    _toDateTimeInfo(input, info);
    return info as checked;
}

/**
 * @internal
 */
export type _DateTimeInfoInputMapping = [
    [Rfc9557Text | TemporalTextInput<DateTimeInfoInput>, Partial<DateTimeInfo>],
    [InstantLike | Temporal.ZonedDateTime, DateTimeInfo],
    [
        Temporal.PlainDate,
        DateLike & EraYearLike & MonthCodeLike & { calendar: CalendarId },
    ],
    [Temporal.PlainTime, TimeLike],
    [Temporal.PlainDateTime, OmitKey<DateTimeInfo, "timeZone">],
    [
        Temporal.PlainMonthDay,
        MonthCodeLike & DayLike & { calendar: CalendarId },
    ],
    [
        Temporal.PlainYearMonth,
        EraYearLike
            & YearLike
            & MonthLike
            & MonthCodeLike & { calendar: CalendarId },
    ],
];

/**
 * @internal
 */
export type _ToDateTimeInfoInput =
    | Rfc9557Text
    | TemporalTextInput<DateTimeInfoInput>
    | InstantLike
    | Exclude<TemporalObject, Temporal.Duration>
    | DateTimeInfoInput;

/**
 * @internal
 */
export type _ToDateTimeInfo<
    T extends _ToDateTimeInfoInput,
    M = _DateTimeInfoInputMapping,
> = Simplify<
    Mutable<
        M extends [infer U, ...infer R]
            ? U extends [infer K, infer S]
                ? T extends K
                    ? S
                    : _ToDateTimeInfo<T, R>
                : "TemporalInfoInputMapping type is wrong: must be a tuple of tuples"
            : T extends DateTimeInfoInput
              ? OmitKey<T, "timeZone" | "calendar">
                    & (keyof T extends "timeZone"
                        ? {
                              timeZone: TimeZoneId;
                          }
                        : {})
                    & (keyof T extends "calendar"
                        ? {
                              calendar: CalendarId;
                          }
                        : {})
              : never
    >
>;

const _rfc9557ParseResult = createRfc9557ParseResult();

/**
 * @internal
 */
export function _createDateTimeInfo(): Partial<DateTimeInfo> {
    return {
        era: undefined,
        eraYear: undefined,
        year: undefined,
        month: undefined,
        monthCode: undefined,
        day: undefined,
        hour: undefined,
        minute: undefined,
        second: undefined,
        millisecond: undefined,
        microsecond: undefined,
        nanosecond: undefined,
        offset: undefined,
        timeZone: undefined,
        calendar: undefined,
    };
}

/**
 * @internal
 */
export function _toDateTimeInfo(
    input: _ToDateTimeInfoInput,
    out: Partial<DateTimeInfo>,
): Partial<DateTimeInfo> {
    const type = typeof input;

    if (type === "string") {
        const result = parseDateTime(input as Rfc9557Text, _rfc9557ParseResult);
        return _rfc9557ParseResultToDateTimeInfo(result, out);
    }

    if (isTemporalTextInput(input as object)) {
        const { format, text } = input as TemporalTextInput<DateTimeInfoInput>;

        if (isString(format)) {
            // TODO
            return null!;
        } else {
            return _infoLikeToInfo(format(text), out);
        }
    }

    if (
        type === "number"
        || type === "bigint"
        || isInstant(input)
        || isDate(input)
        || isZonedDateTime(input)
    ) {
        const zdateTime = toZonedDateTime(
            input as InstantLike | Temporal.ZonedDateTime,
            "UTC",
        );
        return _temporalObjectToDateTimeInfo(zdateTime, out);
    }

    if (isTemporalObject(input)) {
        return _temporalObjectToDateTimeInfo(input, out);
    } else {
        return _infoLikeToInfo(input as object, out);
    }
}

function _rfc9557ParseResultToDateTimeInfo(
    data: RFC9557ParseResult,
    info: Partial<DateTimeInfo>,
) {
    switch (data.dateType) {
        case "year-month":
            info.era = undefined;
            info.eraYear = undefined;
            info.year = data.year;
            info.month = data.month;
            info.monthCode = undefined;
            break;

        case "month-day":
            info.month = data.month;
            info.monthCode = undefined;
            info.day = data.day;
            break;

        case "full":
            info.era = undefined;
            info.eraYear = undefined;
            info.year = data.year;
            info.month = data.month;
            info.monthCode = undefined;
            info.day = data.day;
            break;

        default:
            // do nothings.
            break;
    }

    if (data.hasTime) {
        info.hour = data.hour;
        info.minute = data.minute;
        info.second = data.second;
        info.millisecond = data.millisecond;
        info.microsecond = data.microsecond;
        info.nanosecond = data.nanosecond;
    }

    if (data.offset != null) {
        info.offset = data.offset;
    }

    if (data.timeZone != null) {
        info.timeZone = data.timeZone;
    }

    if (data.calendar != null) {
        info.calendar = data.calendar;
    }

    return info;
}

function _temporalObjectToDateTimeInfo(
    data: Exclude<TemporalObject, Temporal.Instant | Temporal.Duration>,
    info: Partial<DateTimeInfo>,
) {
    if (isPlainDate(data)) {
        info.era = data.era;
        info.eraYear = data.eraYear;
        info.year = data.year;
        info.month = data.month;
        info.monthCode = data.monthCode;
        info.day = data.day;
        info.calendar = data.calendarId;
    } else if (isPlainTime(data)) {
        info.hour = data.hour;
        info.minute = data.minute;
        info.second = data.second;
        info.millisecond = data.millisecond;
        info.microsecond = data.microsecond;
        info.nanosecond = data.nanosecond;
    } else if (isPlainDateTime(data)) {
        info.era = data.era;
        info.eraYear = data.eraYear;
        info.year = data.year;
        info.month = data.month;
        info.monthCode = data.monthCode;
        info.day = data.day;
        info.hour = data.hour;
        info.minute = data.minute;
        info.second = data.second;
        info.millisecond = data.millisecond;
        info.microsecond = data.microsecond;
        info.nanosecond = data.nanosecond;
        info.calendar = data.calendarId;
    } else if (isZonedDateTime(data)) {
        info.era = data.era;
        info.eraYear = data.eraYear;
        info.year = data.year;
        info.month = data.month;
        info.monthCode = data.monthCode;
        info.day = data.day;
        info.hour = data.hour;
        info.minute = data.minute;
        info.second = data.second;
        info.millisecond = data.millisecond;
        info.microsecond = data.microsecond;
        info.nanosecond = data.nanosecond;
        info.offset = data.offset;
        info.timeZone = data.timeZoneId;
        info.calendar = data.calendarId;
    } else if (isPlainMonthDay(data)) {
        info.monthCode = data.monthCode;
        info.day = data.day;
        info.calendar = data.calendarId;
    } else {
        info.era = data.era;
        info.eraYear = data.eraYear;
        info.year = data.year;
        info.month = data.month;
        info.monthCode = data.monthCode;
        info.calendar = data.calendarId;
    }
    return info;
}

function _infoLikeToInfo(data: DateTimeInfoInput, info: Partial<DateTimeInfo>) {
    if ((data.era != null && data.eraYear != null) || data.year != null) {
        info.era = data.era;
        info.eraYear = data.eraYear;
        info.year = data.year;
    }

    if (data.monthCode != null || data.month != null) {
        info.month = data.month;
        info.monthCode = data.monthCode;
    }

    if (data.day != null) {
        info.day = data.day;
    }

    if (data.hour != null) {
        info.hour = data.hour;
    }

    if (data.minute != null) {
        info.minute = data.minute;
    }

    if (data.second != null) {
        info.second = data.second;
    }

    if (data.millisecond != null) {
        info.millisecond = data.millisecond;
    }

    if (data.microsecond != null) {
        info.microsecond = data.microsecond;
    }

    if (data.nanosecond != null) {
        info.nanosecond = data.nanosecond;
    }

    if (data.offset != null) {
        info.offset = data.offset;
    }

    if (data.timeZone != null) {
        info.timeZone = toTimeZoneId(data.timeZone);
    }

    if (data.calendar != null) {
        info.calendar = toCalendarId(data.calendar);
    }

    return info;
}

/**
 * 解析输入为 {@link DurationLike}
 *
 * 解析规则：
 * - {@link DurationText}: 将每个分量直接赋值到 {@link DurationLike} 对象上。
 * - {@link InstantLike}: 全部转换为纳秒或毫秒。
 * - {@link TemporalObject} & {@link DateTimeInfoInput}: 将每个属性直接赋值到 {@link DurationLike} 对象上。
 */
export function toDurationInfo(
    input:
        | DurationText
        | TemporalTextInput<DurationInput>
        | InstantLike
        | TemporalObject
        | DurationInput,
): DurationLike {
    const info = _createDurationInfo();
    const type = typeof input;

    if (
        type === "string"
        || type === "number"
        || type === "bigint"
        || isInstant(input)
        || isDate(input)
        || isZonedDateTime(input)
    ) {
        const duration = toDuration(input as DurationText | InstantLike);
        // TODO
    }

    // TODO

    return null!;
}

/**
 * @internal
 */
export function _createDurationInfo(): DurationLike {
    return {
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        microseconds: 0,
        nanoseconds: 0,
    };
}
