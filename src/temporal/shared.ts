import { Temporal } from "temporal-polyfill";
import type { RequireLeastOneKey } from "../object.js";
import { isBigInt, isString } from "../predicate.js";
import type { MapOf, WeakTagged } from "../ts.js";

declare const timestampTag: unique symbol;
declare const bigIntTimestampTag: unique symbol;
declare const calendarIdTag: unique symbol;
declare const timeZoneIdTag: unique symbol;
declare const rfc9557TextTag: unique symbol;

/**
 * Unix 时间戳
 */
export type Timestamp = WeakTagged<number, typeof timestampTag>;

/**
 * Unix 时间戳
 */
export type BigIntTimestamp = WeakTagged<bigint, typeof bigIntTimestampTag>;

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
 * 可用于构造年份的对象
 *
 * 必须提供 `era` + `eraYear` 或 `year`，如果提供了所有参数则它们必须是一致的。
 */
export type YearLike =
    | {
          readonly year: number;
      }
    | {
          readonly era: string;
          readonly eraYear: number;
      }
    | {
          readonly year: number;
          readonly era: string;
          readonly eraYear: number;
      };

/**
 * 可用于构造月份的对象
 *
 * 必须提供 `month` 或 `monthCode`，如果提供了所有参数则它们必须是一致的。
 */
export type MonthLike =
    | {
          readonly month: number;
      }
    | {
          readonly monthCode: string;
      }
    | {
          readonly month: number;
          readonly monthCode: string;
      };

/**
 * 可用于构造月份天数的对象
 */
export type DayLike = {
    readonly day: number;
};

/**
 * 可用于构造小时的对象
 */
export type HourLike = {
    readonly hour: number;
};

/**
 * 可用于构造分钟的对象
 */
export type MinuteLike = {
    readonly minute: number;
};

/**
 * 可用于构造秒钟的对象
 */
export type SecondLike = {
    readonly second: number;
};

/**
 * 可用于构造毫秒的对象
 */
export type MillisecondLike = {
    readonly millisecond: number;
};

/**
 * 可用于构造微秒的对象
 */
export type MicrosecondLike = {
    readonly microsecond: number;
};

/**
 * 可用于构造纳秒的对象
 */
export type NanosecondLike = {
    readonly nanosecond: number;
};

/**
 * 可用于构造 UTC 偏移量的对象
 *
 * 格式与 RFC 9557 偏移量相同，但带有可选的秒和子秒成分（`±HH:mm:ss.sssssssss`），但不允许使用 `Z`。
 *
 * @see [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)
 */
export type UTCOffsetLike = {
    readonly offset: Rfc9557Text;
};

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
export type CalendarId = WeakTagged<string, typeof calendarIdTag>;

/**
 * 可用于构造日历的对象
 */
export type CalendarLike = {
    readonly calendarId: CalendarId;
};

/**
 * 可作为时间戳日历信息的对象
 */
export type CalendarInfoLike = {
    readonly calendar: CalendarIdLike;
};

/**
 * 可作为日历标识符使用的类型
 */
export type CalendarIdLike = CalendarId | CalendarLike;

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
export type TimeZoneId = WeakTagged<string, typeof timeZoneIdTag>;

/**
 * 可用于构造时区的对象
 */
export type TimeZoneLike = {
    readonly timeZoneId: TimeZoneId;
};

/**
 * 可作为时间戳时区信息的对象
 */
export type TimeZoneInfoLike = {
    readonly timeZone: TimeZoneIdLike;
};

/**
 * 可作为时区标识符使用的类型
 */
export type TimeZoneIdLike = TimeZoneId | TimeZoneLike;

/**
 * 可作为时间戳附加信息的对象
 *
 * @see [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)
 */
export type AdditionalInfoLike = CalendarInfoLike & TimeZoneInfoLike;

/**
 * 输入时间戳附加信息
 *
 * @see {@link AdditionalInfoLike}
 */
export type AdditionalInfoInput = Partial<AdditionalInfoLike>;

/**
 * 可用于构造日期的对象
 */
export type DateLike = YearLike & MonthLike & DayLike;

/**
 * 可用于构造日期的对象
 */
export type TimeLike = HourLike
    & MinuteLike
    & SecondLike
    & MillisecondLike
    & MicrosecondLike
    & NanosecondLike;

/**
 * 输入构造日期的对象
 *
 * @see {@link DateLike}
 * @see {@link CalendarInfoLike}
 */
export type DateInput = Required<DateLike> & Partial<CalendarInfoLike>;

/**
 * 输入构造时间的对象
 *
 * @see {@link TimeLike}
 */
export type TimeInput = RequireLeastOneKey<TimeLike>;

/**
 * 输入构造日期时间的对象
 *
 * @see {@link DateInput}
 * @see {@link TimeLike}
 */
export type DateTimeInput = DateInput & Partial<TimeLike>;

/**
 * 输入构造时区感知的日期时间的对象
 *
 * @see {@link DateInput}
 * @see {@link TimeLike}
 */
export type ZonedDateTimeInput = DateTimeInput
    & TimeZoneInfoLike
    & Partial<UTCOffsetLike>;

// TODO 需要一个比较时区标识符的函数
// TODO 获取所有可用的时区、日历标识符

/**
 * RFC 9557 日期时间字符串
 *
 * @see [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)
 * @example
 * ```ts
 * // "YYYY-MM-DD T HH:mm:ss.sssssssss Z/±HH:mm [time_zone_id] [u-ca=calendar_id]"
 * // "2021-07-01T12:34:56+02:00"
 * // "2024-03-10T02:05:00[America/New_York]"
 * // "2019-12-23T12:00:00-02:00[America/Sao_Paulo]"
 * ```
 */
export type Rfc9557Text = WeakTagged<string, typeof rfc9557TextTag>;

/**
 * 类时间对象
 */
export type TemporalObject =
    | Temporal.Instant
    | Temporal.Duration
    | Temporal.PlainDate
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime;

/**
 * @internal
 */
export function toBigIntTimestamp(
    timestamp: Timestamp | BigIntTimestamp,
): BigIntTimestamp {
    if (isBigInt(timestamp)) {
        return timestamp;
    } else {
        return BigInt(timestamp) * BigInt(1e6);
    }
}

/**
 * @internal
 */
export function toTimeZoneId<T extends TimeZoneIdLike | undefined>(
    timeZone: T,
): TimeZoneId | MapOf<T, undefined> {
    if (timeZone == null) {
        return undefined!;
    } else {
        return isString(timeZone) ? timeZone : timeZone.timeZoneId;
    }
}

/**
 * @internal
 */
export function toCalendarId<T extends CalendarIdLike | undefined>(
    calendar: T,
): CalendarId | MapOf<T, undefined> {
    if (calendar == null) {
        return undefined!;
    } else {
        return isString(calendar) ? calendar : calendar.calendarId;
    }
}

// TODO: is 放到 predicate.ts 中
