import { Temporal } from "temporal-polyfill";
import { HAS_BIGINT } from "../env.js";
import { fdiv } from "../math.js";
import { isString, isZonedDateTime } from "../predicate.js";
import { throwUnsupported } from "./error.js";
import {
    TimestampUnit,
    type AdditionalInfoInput,
    type BigIntTimestamp,
    type Timestamp,
    type TimeZoneIdLike,
    type TimeZoneLike,
} from "./shared.js";

/**
 * 获取当前系统时间的 Unix 时间戳
 *
 * @param unit 时间戳单位，默认 {@link TimestampUnit.Second}
 */
export function unix(
    unit?: TimestampUnit.Millisecond | TimestampUnit.Second,
): Timestamp;
export function unix(
    unit: TimestampUnit.Nanosecond | TimestampUnit.Microsecond,
): BigIntTimestamp;
export function unix(unit?: TimestampUnit): number | bigint;
export function unix(
    unit: TimestampUnit = TimestampUnit.Second,
): Timestamp | BigIntTimestamp {
    switch (unit) {
        case TimestampUnit.Second:
            return s();

        case TimestampUnit.Microsecond:
            return us();

        case TimestampUnit.Millisecond:
            return ms();

        case TimestampUnit.Nanosecond:
            return ns();

        default:
            throwUnsupported(unit, false);
    }
}

/**
 * 获取当前系统时间以秒为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Second}) 的简写。
 */
export function s(): Timestamp {
    return Math.floor(Temporal.Now.instant().epochMilliseconds / 1e3);
}

/**
 * 获取当前系统时间以毫秒为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Millisecond}) 的简写。
 */
export function ms(): Timestamp {
    return Temporal.Now.instant().epochMilliseconds;
}

/**
 * 获取当前系统时间以微妙为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Microsecond}) 的简写。
 */
export function us(): BigIntTimestamp {
    if (HAS_BIGINT) {
        // 不能直接返回 ns / 1e3n，因为 BigInt 除法会截断而不是向下取整
        return fdiv(Temporal.Now.instant().epochNanoseconds, BigInt(1e3));
    } else {
        throwUnsupported(TimestampUnit.Microsecond, false);
    }
}

/**
 * 获取当前系统时间以纳秒为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Nanosecond}) 的简写。
 */
export function ns(): BigIntTimestamp {
    if (HAS_BIGINT) {
        return Temporal.Now.instant().epochNanoseconds;
    } else {
        throwUnsupported(TimestampUnit.Nanosecond, true);
    }
}

/**
 * 获取当前系统时间的瞬时对象
 */
export function instant(): Temporal.Instant {
    return Temporal.Now.instant();
}

/**
 * 获取当前系统挂钟时间的日期对象
 *
 * @param to 指定要返回时间的时区，或者传入 {@link AdditionalInfoInput} 对象指定附加信息，默认为系统时区和 `iso8601` 日历
 */
export function date(
    to?: TimeZoneIdLike | AdditionalInfoInput,
): Temporal.PlainDate {
    return _createDateLike(Temporal.Now.plainDateISO, to);
}

/**
 * 获取当前系统挂钟时间的时间对象
 *
 * @param to 指定要返回时间的时区，默认为系统时区
 */
export function time(to?: TimeZoneIdLike): Temporal.PlainTime {
    return Temporal.Now.plainTimeISO(to);
}

/**
 * 获取当前系统挂钟时间的日期时间对象
 *
 * @param to 指定要返回时间的时区，或者传入 {@link AdditionalInfoInput} 对象指定附加信息，默认为系统时区和 `iso8601` 日历
 */
export function dateTime(
    to?: TimeZoneIdLike | AdditionalInfoInput,
): Temporal.PlainDateTime {
    return _createDateLike(Temporal.Now.plainDateTimeISO, to);
}

/**
 * 获取当前系统时间的时区感知日期时间对象
 *
 * @param to 指定要返回时间的时区，或者传入 {@link AdditionalInfoInput} 对象指定附加信息，默认为系统时区和 `iso8601` 日历
 */
export function zonedDateTime(
    to?: TimeZoneIdLike | AdditionalInfoInput,
): Temporal.ZonedDateTime {
    return _createDateLike(Temporal.Now.zonedDateTimeISO, to);
}

function _createDateLike<
    T extends
        | typeof Temporal.Now.zonedDateTimeISO
        | typeof Temporal.Now.plainDateISO
        | typeof Temporal.Now.plainDateTimeISO,
>(fn: T, addtl?: TimeZoneIdLike | AdditionalInfoInput): ReturnType<T> {
    let timeZone: Temporal.TimeZoneLike | undefined;
    let calendar: Temporal.CalendarLike | undefined;
    if (addtl != null) {
        if (isString(addtl) || isZonedDateTime(addtl)) {
            timeZone = addtl;
        } else {
            timeZone = addtl.timeZone;
            calendar = addtl.calendar;
        }
    }
    let date = fn(timeZone);
    if (calendar != null) {
        date = date.withCalendar(calendar);
    }
    return date as ReturnType<T>;
}

/**
 * 获取当前系统时区标识符
 */
export function timeZone(): TimeZoneLike {
    return {
        timeZone: Temporal.Now.timeZoneId(),
    };
}

/**
 * 获取当前系统时区标识符
 */
export function timeZoneId() {
    return Temporal.Now.timeZoneId();
}

// TODO 获取当前日历
