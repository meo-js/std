import { Temporal } from "temporal-polyfill";
import { isBigInt, isString } from "../predicate.js";
import type { MapOf, Tagged, Weaken } from "../ts.js";

/**
 * Unix 时间戳
 */
export type Timestamp = Tagged<number, "timestamp">;

/**
 * Unix 时间戳
 */
export type BigIntTimestamp = Tagged<bigint, "timestamp">;

/**
 * Unix 时间戳单位
 */
export enum TimestampUnit {
    /**
     * 以秒为单位的 Unix 时间戳
     */
    Second = "second",

    /**
     * 以毫秒为单位的 Unix 时间戳
     */
    Millisecond = "millisecond",

    /**
     * 以微妙为单位的 Unix 时间戳
     */
    Microsecond = "microsecond",

    /**
     * 以纳秒为单位的 Unix 时间戳
     */
    Nanosecond = "nanosecond",
}

/**
 * TODO: 需要命名
 */
export interface TODO1Options {
    /**
     * 指定返回时间的时区
     *
     * @default 系统时区
     */
    timeZone?: TimeZoneLike;

    /**
     * 指定返回时间的日历
     *
     * @default `iso8601`
     */
    calendar?: CalendarLike;
}

/**
 * TODO: 需要命名
 */
export interface TODO2Options {
    /**
     * 时区标识符
     *
     * @see {@link TimeZoneId}
     */
    readonly timeZoneId: Weaken<TimeZoneId>;
}

/**
 * TODO: 需要命名
 */
export interface TODO3Options {
    /**
     * 日历标识符
     *
     * @see {@link CalendarId}
     */
    readonly calendarId: Weaken<CalendarId>;
}

/**
 * 类时区类型
 */
export type TimeZoneLike = Weaken<TimeZoneId> | TODO2Options;

/**
 * RFC 9557 标准的时区标识符
 *
 * 需注意某些地方不允许秒级精度。
 *
 * @see [IANA 时区数据库](https://www.iana.org/time-zones)
 * @example IANA 时区标识符
 * ```ts
 * // "UTC"
 * // "America/New_York"
 * // "Asia/Shanghai"
 * ```
 * @example 偏移时区标识符
 * ```ts
 * // "-08"
 * // "+08:00"
 * // "-08:00"
 * // "+0800"
 * ```
 */
export type TimeZoneId = Tagged<string, "timezone-id">;

// TODO 需要一个比较时区标识符的函数
// TODO 获取所有可用的时区、日历标识符

/**
 * 类日历类型
 */
export type CalendarLike = Weaken<CalendarId> | TODO3Options;

/**
 * CLDR 日历标识符
 *
 * @see [CLDR Calendar type keys](https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml)
 * @example
 * ```ts
 * // "iso8601"
 * // "gregory"
 * // "chinese"
 * ```
 */
export type CalendarId = Tagged<string, "calendar-id">;

// TODO {@link https://datatracker.ietf.org/doc/html/rfc9557|RFC 9557 string}
export type RFC9557 = string;

/**
 * 类时间对象
 */
export type TemporalLike =
    | Temporal.Instant
    | Temporal.Duration
    | Temporal.PlainDate
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime;

/**
 * 类瞬时对象
 */
export type InstantLike =
    | Timestamp
    | BigIntTimestamp
    | Temporal.Instant
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime;

/**
 * @internal
 */
export function toBigIntTimestamp(
    timestamp: Weaken<Timestamp | BigIntTimestamp>,
): BigIntTimestamp {
    if (isBigInt(timestamp)) {
        return timestamp as BigIntTimestamp;
    } else {
        return (BigInt(timestamp) * BigInt(1e6)) as BigIntTimestamp;
    }
}

/**
 * @internal
 */
export function toTimeZoneId<T extends TimeZoneLike | undefined>(
    timeZone: T,
): TimeZoneId | MapOf<T, undefined> {
    if (timeZone == null) {
        return undefined!;
    } else {
        return (
            isString(timeZone) ? timeZone : timeZone.timeZoneId
        ) as TimeZoneId;
    }
}

/**
 * @internal
 */
export function toCalendarId<T extends CalendarLike | undefined>(
    calendar: T,
): CalendarId | MapOf<T, undefined> {
    if (calendar == null) {
        return undefined!;
    } else {
        return (
            isString(calendar) ? calendar : calendar.calendarId
        ) as CalendarId;
    }
}

// TODO: 放到 predicate.ts 中

/**
 * 检测值是否为 {@link TimeZoneLike}
 *
 * @param value 任意值
 * @returns `boolean`
 */
export function isTimeZoneLike(value: unknown): value is TimeZoneLike {
    return typeof value === "string" || value instanceof Temporal.ZonedDateTime;
}
