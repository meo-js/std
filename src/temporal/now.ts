import { Temporal } from "temporal-polyfill";
import { HAS_BIGINT } from "../env.js";
import { fdiv } from "../math.js";
import { throwUnsupported } from "./error.js";
import {
    TimestampUnit,
    toTimeZoneId,
    type BigIntTimestamp,
    type Timestamp,
    type TimeZoneId,
    type TimeZoneLike,
    type TODO1Options,
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
export function s() {
    return Math.floor(
        Temporal.Now.instant().epochMilliseconds / 1e3,
    ) as Timestamp;
}

/**
 * 获取当前系统时间以毫秒为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Millisecond}) 的简写。
 */
export function ms() {
    return Temporal.Now.instant().epochMilliseconds as Timestamp;
}

/**
 * 获取当前系统时间以微妙为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Microsecond}) 的简写。
 */
export function us() {
    if (HAS_BIGINT) {
        // 不能直接返回 ns / 1e3n，因为 BigInt 除法会截断而不是向下取整
        return fdiv(
            Temporal.Now.instant().epochNanoseconds,
            BigInt(1e3),
        ) as BigIntTimestamp;
    } else {
        throwUnsupported(TimestampUnit.Microsecond, false);
    }
}

/**
 * 获取当前系统时间以纳秒为单位的 Unix 时间戳
 *
 * 等同于 {@link unix}({@link TimestampUnit.Nanosecond}) 的简写。
 */
export function ns() {
    if (HAS_BIGINT) {
        return Temporal.Now.instant().epochNanoseconds as BigIntTimestamp;
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
 * 获取当前系统时间的日期对象
 *
 * @param opts 指定返回时间的时区或者 {@link TODO1Options} 对象，默认为系统时区和 `iso8601` 日历
 */
export function date(opts?: TimeZoneLike | TODO1Options): Temporal.PlainDate {
    return _createDateLike(Temporal.Now.plainDateISO, opts);
}

/**
 * 获取当前系统时间的时间对象
 *
 * @param timeZone 指定返回时间的时区，默认为系统时区
 */
export function time(timeZone?: TimeZoneLike): Temporal.PlainTime {
    return Temporal.Now.plainTimeISO(toTimeZoneId(timeZone));
}

/**
 * 获取当前系统时间的日期时间对象
 *
 * @param opts 指定返回时间的时区或者 {@link TODO1Options} 对象，默认为系统时区和 `iso8601` 日历
 */
export function dateTime(
    opts?: TimeZoneLike | TODO1Options,
): Temporal.PlainDateTime {
    return _createDateLike(Temporal.Now.plainDateTimeISO, opts);
}

/**
 * 获取当前系统时间的时区感知的日期时间对象
 *
 * @param opts 指定返回时间的时区或者 {@link TODO1Options} 对象，默认为系统时区和 `iso8601` 日历
 */
export function zonedDateTime(
    opts?: TimeZoneLike | TODO1Options,
): Temporal.ZonedDateTime {
    return _createDateLike(Temporal.Now.zonedDateTimeISO, opts);
}

function _createDateLike<
    T extends
        | typeof Temporal.Now.zonedDateTimeISO
        | typeof Temporal.Now.plainDateISO
        | typeof Temporal.Now.plainDateTimeISO,
>(fn: T, opts?: TimeZoneLike | TODO1Options): ReturnType<T> {
    // TODO
    // let timeZone: TimeZoneLike | undefined;
    // let calendar: CalendarLike | undefined;
    // if (opts != null) {
    //     if (isTimeZoneLike(opts)) {
    //         timeZone = opts;
    //     } else {
    //         timeZone = opts.timeZone;
    //         calendar = opts.calendar;
    //     }
    // }
    // let date = fn(timeZone);
    // if (calendar != null) {
    //     date = date.withCalendar(calendar);
    // }
    // return date as ReturnType<T>;
    return undefined!;
}

/**
 * 获取当前系统时区
 */
export function timeZoneId() {
    return Temporal.Now.timeZoneId() as TimeZoneId;
}

// TODO 获取当前日历
