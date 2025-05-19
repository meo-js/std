import { Temporal, toTemporalInstant } from "temporal-polyfill";
import { HAS_BIGINT } from "../env.js";
import type { RequireLeastOneKey } from "../object.js";
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
import type { checked } from "../ts.js";
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
    type CalendarIdLike,
    type CalendarLike,
    type DateInput,
    type DateTemporal,
    type DateTimeInput,
    type DateTimeLike,
    type DateTimeTemporal,
    type DurationInput,
    type DurationLike,
    type DurationText,
    type EraYearLike,
    type InstantLike,
    type MonthCodeLike,
    type Rfc9557Text,
    type TemporalInfo,
    type TemporalInfoInput,
    type TemporalInfoLike,
    type TemporalObject,
    type TemporalTextInput,
    type TimeInput,
    type Timestamp,
    type TimeTemporal,
    type TimeZoneIdLike,
    type TimeZoneLike,
    type ToTemporalInfo,
    type UTCOffsetLike,
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
 * @param input RFC 9557 规范持续时间字符串；以毫秒 {@link Timestamp}、纳秒 {@link BigIntTimestamp} 为单位的 Unix 时间戳；{@link Temporal.Instant}、{@link Date} 对象；包含时间日期分量的对象，缺失的分量被视为 `0`
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
 * 解析输入为 {@link TemporalInfo}
 *
 * 解析规则：
 * - {@link Rfc9557Text}: 将每个分量直接赋值到 {@link TemporalInfo} 对象上。
 * - {@link InstantLike}: 全部作为 "UTC" 时区与 "iso8601" 日历进行解析。
 * - {@link TemporalObject} & {@link TemporalInfoLike}: 将每个属性直接赋值到 {@link TemporalInfo} 对象上。
 */
export function toTemporalInfo<T extends TemporalInfoInput>(
    input: T,
): { [K in keyof ToTemporalInfo<T>]: ToTemporalInfo<T>[K] } {
    const info = _createTemporalInfo();
    _toTemporalInfo(input, info);
    return info as checked;
}

const _rfc9557ParseResult = createRfc9557ParseResult();

/**
 * @internal
 */
export function _createTemporalInfo(): Partial<TemporalInfo> {
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
export function _toTemporalInfo(
    input: TemporalInfoInput,
    out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
    const type = typeof input;

    if (type === "string") {
        const result = parseDateTime(input as Rfc9557Text, _rfc9557ParseResult);
        return _rfc9557ParseResultToInfo(result, out);
    }

    if (isTemporalTextInput(input as object)) {
        const { format, text } = input as TemporalTextInput<TemporalInfoLike>;

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
        return _temporalObjectToInfo(zdateTime, out);
    }

    if (isTemporalObject(input)) {
        return _temporalObjectToInfo(input, out);
    } else {
        return _infoLikeToInfo(input as object, out);
    }
}

function _rfc9557ParseResultToInfo(
    data: RFC9557ParseResult,
    info: Partial<TemporalInfo>,
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

function _temporalObjectToInfo(
    data: Exclude<TemporalObject, Temporal.Instant | Temporal.Duration>,
    info: Partial<TemporalInfo>,
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

function _infoLikeToInfo(
    data: Partial<
        DateTimeLike
            & EraYearLike
            & MonthCodeLike
            & TimeZoneLike
            & CalendarLike
            & UTCOffsetLike
    >,
    info: Partial<TemporalInfo>,
) {
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
