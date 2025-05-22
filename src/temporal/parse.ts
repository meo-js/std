import { Temporal, toTemporalInstant } from "temporal-polyfill";
import { HAS_BIGINT } from "../env.js";
import type { OmitKey, RequireLeastOneKey } from "../object.js";
import { isDate, isInstant, isString } from "../predicate.js";
import type { checked, Mutable, Simplify } from "../ts.js";
import { createParseResult, parse } from "./formatter/rfc9557.js";
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
    type DurationInfo,
    type DurationInput,
    type DurationLike,
    type DurationText,
    type EraYearLike,
    type InstantLike,
    type InstantLikeWithTimeZone,
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
                return Temporal.Duration.from(
                    _infoLikeToDurationInfo(
                        input as DurationInput,
                        _durationinfo,
                    ),
                );
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
 * 解析多个输入并合并为 {@link DateTimeInfo}
 *
 * 单个输入解析规则：
 * - {@link Rfc9557Text}: 若偏移量为 `Z`，有时区或日历标识符时会尝试转换为本地时间，若无法进行转换则会抛出错误，无时区或日历标识符时则作为 `UTC` 时区与默认日历进行解析。
 * - {@link InstantLikeWithTimeZone}: 转换为本地时间。
 * - {@link TemporalObject} & {@link DateTimeInfoInput}: 将每个属性直接赋值到 {@link DateTimeInfo} 对象上。
 *
 * 若传入多个输入，则像 {@link Object.assign} 函数一样依次将对象合并为一个并返回，后面的输入会覆盖前面的输入。
 *
 * 注意：该函数在合并时逐个覆盖属性值，不会做任何的时区或者日历转换，如果将两个不同时区或者日历的日期与时间合并可能会毫无意义！
 */
export function toDateTimeInfo<T extends _ToDateTimeInfoInput[]>(
    ...inputs: T
): { [K in keyof _ToDateTimeInfos<T>]: _ToDateTimeInfos<T>[K] } {
    const out = _createDateTimeInfo();
    for (const input of inputs) {
        _toDateTimeInfo(input, out);
    }
    return out as checked;
}

type _ToDateTimeInfos<T extends _ToDateTimeInfoInput[]> = T extends [
    infer U extends _ToDateTimeInfoInput,
    ...infer R extends _ToDateTimeInfoInput[],
]
    ? _ToDateTimeInfo<U> & _ToDateTimeInfos<R>
    : {};

type _DateTimeInfoInputMapping = [
    [Rfc9557Text | TemporalTextInput<DateTimeInfoInput>, Partial<DateTimeInfo>],
    [InstantLikeWithTimeZone | Temporal.ZonedDateTime, DateTimeInfo],
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

type _ToDateTimeInfoInput =
    | Rfc9557Text
    | TemporalTextInput<DateTimeInfoInput>
    | InstantLikeWithTimeZone
    | Exclude<TemporalObject, Temporal.Instant | Temporal.Duration>
    | DateTimeInfoInput;

type _ToDateTimeInfo<
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

const _rfc9557ParseResult = createParseResult();
const _durationinfo = _createDurationInfo();

function _createDateTimeInfo(): Partial<DateTimeInfo> {
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

function _toDateTimeInfo(
    input: _ToDateTimeInfoInput,
    out: Partial<DateTimeInfo>,
): Partial<DateTimeInfo> {
    const type = typeof input;

    if (type === "string") {
        const result = parse(input as Rfc9557Text, _rfc9557ParseResult);
        if (result.z) {
            if (result.timeZone == null && result.calendar == null) {
                result.timeZone = "UTC";
            } else {
                const zdateTime = toZonedDateTime(
                    result as unknown as DateTimeInfo,
                );
                return _infoLikeToDateTimeInfo(zdateTime, out);
            }
        }
        return _infoLikeToDateTimeInfo(result, out);
    }

    if (isTemporalTextInput(input as object)) {
        const { formatter, text } =
            input as TemporalTextInput<DateTimeInfoInput>;

        if (isString(formatter)) {
            // TODO
            return null!;
        } else {
            return _infoLikeToDateTimeInfo(formatter.parse(text), out);
        }
    }

    if (<keyof InstantLikeWithTimeZone>"instant" in input) {
        const { instant, timeZone } = input as InstantLikeWithTimeZone;
        const zdateTime = toZonedDateTime(instant, timeZone);
        return _infoLikeToDateTimeInfo(zdateTime, out);
    }

    return _infoLikeToDateTimeInfo(
        input as
            | Exclude<TemporalObject, Temporal.Instant | Temporal.Duration>
            | DateTimeInfoInput,
        out,
    );
}

function _infoLikeToDateTimeInfo(
    data: DateTimeInfoInput,
    out: Partial<DateTimeInfo>,
) {
    const {
        era,
        eraYear,
        year,
        month,
        monthCode,
        day = out.day,
        hour = out.hour,
        minute = out.minute,
        second = out.second,
        millisecond = out.millisecond,
        microsecond = out.microsecond,
        nanosecond = out.nanosecond,
        offset = out.offset,
        timeZone = out.timeZone,
        calendar = out.calendar,
    } = data;

    if ((era != null && eraYear != null) || year != null) {
        out.era = era;
        out.eraYear = eraYear;
        out.year = year;
    }

    if (monthCode != null || month != null) {
        out.month = month;
        out.monthCode = monthCode;
    }

    out.day = day;
    out.hour = hour;
    out.minute = minute;
    out.second = second;
    out.millisecond = millisecond;
    out.microsecond = microsecond;
    out.nanosecond = nanosecond;
    out.offset = offset;
    out.timeZone = toTimeZoneId(timeZone);
    out.calendar = toCalendarId(calendar);

    return out;
}

/**
 * 解析多个输入并累加为 {@link DurationInfo}
 *
 * 单个输入解析规则：
 * - {@link DurationText}: 将每个分量直接赋值到 {@link DurationInfo} 对象上。
 * - {@link InstantLike}: 除了 {@link Temporal.ZonedDateTime} 外全部转换为纳秒或毫秒。
 * - {@link TemporalObject} & {@link DateTimeInfoInput}: 将每个属性直接赋值到 {@link DurationInfo} 对象上。
 *
 * 若传入多个输入，则会累加每个属性值，注意不要超出 `number` 类型的数值范围。
 */
export function toDurationInfo(
    ...inputs: _ToDurationInfoInput[]
): DurationInfo {
    const out = _createDurationInfo();
    for (const input of inputs) {
        _toDurationInfo(input, out);
    }
    return out as checked;
}

type _ToDurationInfoInput =
    | DurationText
    | TemporalTextInput<DurationInput>
    | InstantLike
    | TemporalObject
    | DurationInput;

function _createDurationInfo(): DurationInfo {
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

function _toDurationInfo(input: _ToDurationInfoInput, out: DurationInfo) {
    const type = typeof input;

    if (
        type === "string"
        || type === "number"
        || type === "bigint"
        || isInstant(input)
        || isDate(input)
    ) {
        const duration = toDuration(input as DurationText | InstantLike);
        return _infoLikeToDurationInfo(duration, out);
    }

    return _infoLikeToDurationInfo(
        input as Exclude<TemporalObject, Temporal.Instant> | DurationInput,
        out,
    );
}

function _infoLikeToDurationInfo(data: DurationInput, out: DurationInfo) {
    const obj = data as RequireLeastOneKey<DateTimeLike>;
    const {
        years = obj.year ?? 0,
        months = obj.month ?? 0,
        weeks = 0,
        days = obj.day ?? 0,
        hours = obj.hour ?? 0,
        minutes = obj.minute ?? 0,
        seconds = obj.second ?? 0,
        milliseconds = obj.millisecond ?? 0,
        microseconds = obj.microsecond ?? 0,
        nanoseconds = obj.nanosecond ?? 0,
    } = data as RequireLeastOneKey<DurationLike>;

    out.years += years;
    out.months += months;
    out.weeks += weeks;
    out.days += days;
    out.hours += hours;
    out.minutes += minutes;
    out.seconds += seconds;
    out.milliseconds += milliseconds;
    out.microseconds += microseconds;
    out.nanoseconds += nanoseconds;

    return out;
}
