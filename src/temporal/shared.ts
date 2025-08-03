import { Temporal } from "temporal-polyfill";
import { fdiv } from "../math/bigint.js";
import type { RequireLeastOneKey } from "../object.js";
import { isBigInt, isString } from "../predicate.js";
import type { MapOf, Mutable, WeakTagged } from "../ts.js";
import type {
    toDate,
    toDateTime,
    toDuration,
    toInstant,
    toTime,
    toZonedDateTime,
} from "./format.js";

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
 * 本地日期时间不明确（有多个相同的时刻，或者不存在该时刻）的处理策略
 *
 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#ambiguity_and_gaps_from_local_time_to_utc_time)
 */
export enum UTCPolicy {
    /**
     * - 如果存在两个可能的时刻，则选择较早的一个。
     * - 如果存在间隙，则按间隙时间前进。
     */
    Compatible = "compatible",

    /**
     * - 如果存在两个可能的时刻，则选择较早的一个。
     * - 如果存在间隙，则按间隙时间倒退。
     */
    Earlier = "earlier",

    /**
     * - 如果存在两个可能的时刻，则选择较晚的一个。
     * - 如果存在间隙，则按间隙时间前进。
     */
    Later = "later",

    /**
     * - 出现歧义或者间隙时，抛出 {@link RangeError} 错误。
     */
    Reject = "reject",
}

/**
 * 偏移量在当前本地时区中无效的处理策略
 *
 * @see [MDN - Offset ambiguity](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#offset_ambiguity)
 * @see [MDN - Offset during date changes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/with#offset_during_date_changes)
 */
export enum OffsetPolicy {
    /**
     * 使用偏移量计算精确时间
     *
     * 该选项在确定字符串所代表的时刻时使用偏移量，即使该时刻的偏移量发生了变化，偏移量也将是我们存储时间时最初计算出的同一时刻。
     *
     * 时区标识符仍用于推断偏移量（可能已更新），并使用偏移量将准确时间转换为本地时间。
     */
    Use = "use",

    /**
     * 使用时区标识符重新计算偏移量，忽略字符串中指定的偏移量
     *
     * 若时间存在不明确的情况，则使用 {@link Disambiguation} 解决。
     */
    Ignore = "ignore",

    /**
     * 无效时直接抛出 {@link RangeError} 错误
     */
    Reject = "reject",

    /**
     * 使用时区标识符重新计算偏移量，忽略字符串中指定的偏移量
     *
     * 若时间存在不明确的情况，则使用字符串中指定的偏移量解决。
     */
    Prefer = "prefer",
}

/**
 * 当日期超出有效范围的处理策略
 *
 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/from#overflow)
 */
export enum OverflowPolicy {
    /**
     * 日期会按规则被限制在有效范围内
     *
     * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate#invalid_date_clamping)
     */
    Constrain = "constrain",

    /**
     * 直接抛出 {@link RangeError} 错误
     */
    Reject = "reject",
}

declare const timestampTag: unique symbol;
declare const bigIntTimestampTag: unique symbol;
declare const calendarIdTag: unique symbol;
declare const timeZoneIdTag: unique symbol;
declare const dateTimeTextTag: unique symbol;
declare const durationTextTag: unique symbol;
declare const temporalTextTag: unique symbol;
declare const temporalTemplateTag: unique symbol;

/**
 * Unix 时间戳
 */
export type Timestamp = WeakTagged<number, typeof timestampTag>;

/**
 * Unix 时间戳
 */
export type BigIntTimestamp = WeakTagged<bigint, typeof bigIntTimestampTag>;

/**
 * 可用于构造年份的对象
 */
export type YearLike = {
    readonly year: number;
};

/**
 * 可用于构造年份的对象
 */
export type EraYearLike = {
    readonly era: string;
    readonly eraYear: number;
};

/**
 * 可用于构造年份的对象
 *
 * 允许 {@link EraYearLike} 和 {@link YearLike}，如果包含两者，则它们表示的年份必须是一致的。
 */
export type AnyYearLike =
    // FIXME: 若直接引用 YearLike 和 EraYearLike，TypeScript 报错提示不正确
    //        就像下面的顺序会影响报错的提示。
    | {
          readonly year: number;
          readonly era: string;
          readonly eraYear: number;
      }
    | {
          readonly era: string;
          readonly eraYear: number;
      }
    | {
          readonly year: number;
      };

/**
 * 可用于构造月份的对象
 */
export type MonthLike = {
    readonly month: number;
};

/**
 * 可用于构造月份的对象
 */
export type MonthCodeLike = {
    readonly monthCode: string;
};

/**
 * 可用于构造月份的对象
 *
 * 允许 {@link MonthLike} 和 {@link MonthCodeLike}，如果包含两者，则它们表示的年份必须是一致的。
 */
export type AnyMonthLike =
    // FIXME: 若直接引用 MonthLike 和 MonthCodeLike，TypeScript 报错提示不正确
    //        就像下面的顺序会影响报错的提示。
    | {
          readonly month: number;
          readonly monthCode: string;
      }
    | {
          readonly monthCode: string;
      }
    | {
          readonly month: number;
      };

/**
 * 可用于构造周数的对象
 */
export type WeekLike = {
    readonly week: number;
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
 * 可用于构造日期的对象
 *
 * 不允许 {@link EraYearLike} 和 {@link MonthCodeLike} 的属性。
 */
export type DateLike = YearLike & MonthLike & DayLike;

/**
 * 可用于构造日期的对象
 *
 * 允许 {@link EraYearLike} 和 {@link MonthCodeLike} 的属性。
 */
export type AnyDateLike = AnyYearLike & AnyMonthLike & DayLike;

/**
 * 可用于构造时间的对象
 */
export type TimeLike = HourLike
    & MinuteLike
    & SecondLike
    & MillisecondLike
    & MicrosecondLike
    & NanosecondLike;

/**
 * 可用于构造日期时间的对象
 */
export type DateTimeLike = DateLike & TimeLike;

/**
 * 可用于构造持续时间的对象
 */
export type DurationLike = {
    readonly years: number;
    readonly months: number;
    readonly weeks: number;
    readonly days: number;
    readonly hours: number;
    readonly minutes: number;
    readonly seconds: number;
    readonly milliseconds: number;
    readonly microseconds: number;
    readonly nanoseconds: number;
};

/**
 * 可用于构造 UTC 偏移量的对象
 *
 * 格式与 RFC 9557 偏移量相同，但可以带有可选的秒和子秒成分（`±HH:mm:ss.sssssssss`）。
 *
 * @see [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)
 */
export type UTCOffsetLike = {
    readonly offset: DateTimeText;
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
 * 带有日历标识符的对象
 */
export type CalendarObject =
    | Temporal.ZonedDateTime
    | Temporal.PlainDateTime
    | Temporal.PlainDate
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay;

/**
 * 可用于构造日历标识符的对象
 */
export type CalendarLike = {
    readonly calendar: CalendarIdLike;
};

/**
 * 可用于构造日历标识符的对象
 */
export type CalendarObjectLike = {
    readonly calendar: CalendarId;
};

/**
 * 可作为日历标识符使用的类型
 */
export type CalendarIdLike = CalendarId | CalendarObject;

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
 * 可作为时区标识符使用的类型
 */
export type TimeZoneIdLike = TimeZoneId | TimeZoneObject;

/**
 * 带有时区标识符的对象
 */
export type TimeZoneObject = Temporal.ZonedDateTime;

/**
 * 可用于构造时区标识符的对象
 */
export type TimeZoneLike = {
    readonly timeZone: TimeZoneIdLike;
};

/**
 * {@link toInstant} 函数的输入类型
 *
 * 未特别说明的情况下，{@link Timestamp} 的单位是毫秒，{@link BigIntTimestamp} 的单位是纳秒。
 */
export type InstantInput = Timestamp | BigIntTimestamp;

/**
 * 可用于构造瞬时的对象
 */
export type InstantObject = Temporal.Instant | Temporal.ZonedDateTime | Date;

/**
 * {@link toDuration} 函数的输入类型
 */
export type DurationInput =
    | number
    | bigint
    | RequireLeastOneKey<DurationLike>
    | RequireLeastOneKey<DateTimeLike & WeekLike>;

/**
 * 可用于构造持续时间的对象
 */
export type DurationObject = TemporalObject | Date;

/**
 * {@link toDate} 函数的输入类型
 */
export type DateInput = AnyDateLike & Partial<CalendarLike>;

/**
 * 可用于构造日期的 {@link Temporal} 对象
 */
export type DateObject =
    | Temporal.Instant
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime
    | Date;

/**
 * {@link toTime} 函数的输入类型
 */
export type TimeInput = RequireLeastOneKey<TimeLike>;

/**
 * 可用于构造时间的 {@link Temporal} 对象
 */
export type TimeObject =
    | Temporal.Instant
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime
    | Date;

/**
 * {@link toDateTime} 函数的输入类型
 */
export type DateTimeInput = DateInput & Partial<TimeLike>;

/**
 * 可用于构造日期时间的 {@link Temporal} 对象
 */
export type DateTimeObject =
    | Temporal.Instant
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime
    | Date;

/**
 * {@link toZonedDateTime} 函数的输入类型
 */
export type ZonedDateTimeInput = DateTimeInput
    & TimeZoneLike
    & Partial<UTCOffsetLike>;

/**
 * 可用于构造时区感知的日期时间的 {@link Temporal} 对象
 */
export type ZonedDateTimeObject = Temporal.ZonedDateTime;

/**
 * 可作为时间戳附加信息的对象
 *
 * @see [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)
 */
export type AdditionalInfo = CalendarLike & TimeZoneLike;

/**
 * 时间戳附加信息的输入类型
 *
 * @see {@link AdditionalInfo}
 */
export type AdditionalInfoInput = Partial<AdditionalInfo>;

/**
 * 本地时间转换到 UTC 的选项
 */
export type UTCOptions = {
    /**
     * 本地日期时间不明确（有多个相同的时刻，或者不存在该时刻）的处理策略
     *
     * @default {@link UTCPolicy.Compatible}
     *
     * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#ambiguity_and_gaps_from_local_time_to_utc_time)
     */
    disambiguation?: UTCPolicy;
};

/**
 * 时区处理选项
 */
export type TimeZoneOptions = {
    /**
     * 偏移量在当前本地时区中无效的处理策略
     *
     * @default 名称带有 `to`、`from` 的构造日期时间对象的函数默认为 {@link OffsetPolicy.Reject}，其它类似 `with` 设置器的方法默认为 {@link OffsetPolicy.Prefer}
     *
     * @see [MDN - Offset ambiguity](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#offset_ambiguity)
     * @see [MDN - Offset during date changes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/with#offset_during_date_changes)
     */
    offset?: OffsetPolicy;
};

/**
 * 日期时间赋值选项
 */
export type AssignmentOptions = {
    /**
     * 当日期时间超出有效范围的处理策略
     *
     * @default {@link OverflowPolicy.Constrain}
     *
     * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/from#overflow)
     */
    overflow?: OverflowPolicy;
};

/**
 * 时区感知日期时间赋值选项
 */
export type ZonedAssignmentOptions = Partial<
    UTCOptions & TimeZoneOptions & AssignmentOptions
>;

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
export type DateTimeText = WeakTagged<string, typeof dateTimeTextTag>;

/**
 * ISO 8601 持续时间字符串
 *
 * @see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#iso_8601_duration_format)
 * @example
 * ```ts
 * // "±P [n]Y [n]M [n]D T [n]H [n]M [n]S"
 * // "P1Y1M1DT1H1M1.1S"
 * // "P40D"
 * // "P1Y1D"
 * // "PT1M"
 * // "PT0S"
 * // "P0D"
 */
export type DurationText = WeakTagged<string, typeof durationTextTag>;

/**
 * 能够被 {@link TemporalTemplate} 解析的字符串
 */
export type TemporalText = WeakTagged<string, typeof temporalTextTag>;

/**
 * 时态文本模板
 *
 * 基于 Unicode Technical Standard #35（tr35 LDML）定义的模板格式。
 *
 * @see [Unicode Technical Standard #35 - Date Format Patterns](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns)
 */
export type TemporalTemplate = WeakTagged<string, typeof temporalTemplateTag>;

/**
 * 内置时态对象
 */
export type TemporalObject =
    | Temporal.Instant
    | Temporal.Duration
    | Temporal.PlainDate
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.ZonedDateTime
    | Temporal.PlainMonthDay
    | Temporal.PlainYearMonth;

/**
 * 时态信息
 *
 * 时态信息中的日期时间属性表示的是挂钟时间。
 */
// TODO: 测试用例：必须能够传入所有 toXXX 和 format 接口
export interface TemporalInfo
    extends Mutable<DateTimeLike>,
        Mutable<EraYearLike>,
        Mutable<MonthCodeLike>,
        Mutable<WeekLike>,
        Mutable<TimeZoneLike>,
        Mutable<CalendarLike>,
        Mutable<UTCOffsetLike> {}

/**
 * 时态信息的输入类型
 */
export type TemporalInfoInput =
    | DateTimeText
    | DurationText
    | Timestamp
    | BigIntTimestamp
    | Partial<TemporalInfo>
    | Partial<DurationLike>
    | TemporalObject
    | Date;

// TODO 需要一个比较时区标识符的函数
// TODO 获取所有可用的时区、日历标识符

/**
 * @internal
 */
export function isDurationText(text: string): text is DurationText {
    return (
        text.startsWith("P")
        || text.startsWith("p")
        // ±P<duration>
        || text[1] === "P"
        || text[1] === "p"
    );
}

/**
 * @internal
 */
export function isDurationLike(value: object): value is Partial<DurationLike> {
    return (
        <keyof DurationLike>"years" in value
        || <keyof DurationLike>"months" in value
        || <keyof DurationLike>"weeks" in value
        || <keyof DurationLike>"days" in value
        || <keyof DurationLike>"hours" in value
        || <keyof DurationLike>"minutes" in value
        || <keyof DurationLike>"seconds" in value
        || <keyof DurationLike>"milliseconds" in value
        || <keyof DurationLike>"microseconds" in value
        || <keyof DurationLike>"nanoseconds" in value
    );
}

/**
 * @internal
 */
export function toTimestamp(timestamp: Timestamp | BigIntTimestamp): Timestamp {
    if (isBigInt(timestamp)) {
        return Number(fdiv(timestamp, BigInt(1e6)));
    } else {
        return timestamp;
    }
}

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

/**
 * @internal
 */
export function withCalendar<
    T extends
        | Temporal.ZonedDateTime
        | Temporal.PlainDate
        | Temporal.PlainDateTime,
>(dateTime: T, calendar?: CalendarIdLike): T {
    return calendar ? (dateTime.withCalendar(calendar) as T) : dateTime;
}

/**
 * @internal
 */
export const _tempTemporalInfo = createTemporalInfo();

/**
 * @internal
 */
export function createTemporalInfo(): Partial<TemporalInfo> {
    return {
        era: undefined,
        eraYear: undefined,
        year: undefined,
        month: undefined,
        monthCode: undefined,
        week: undefined,
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
export function resetTemporalInfo(
    info: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
    info.era = undefined;
    info.eraYear = undefined;
    info.year = undefined;
    info.month = undefined;
    info.monthCode = undefined;
    info.week = undefined;
    info.day = undefined;
    info.hour = undefined;
    info.minute = undefined;
    info.second = undefined;
    info.millisecond = undefined;
    info.microsecond = undefined;
    info.nanosecond = undefined;
    info.offset = undefined;
    info.timeZone = undefined;
    info.calendar = undefined;
    return info;
}
