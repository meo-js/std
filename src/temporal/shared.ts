import { Temporal } from "temporal-polyfill";
import type { RequireLeastOneKey } from "../object.js";
import { isBigInt, isString, isTemporalObject } from "../predicate.js";
import type { MapOf, Mutable, WeakTagged } from "../ts.js";

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
 * 必须提供 `era` + `eraYear` 或 `year`，如果提供了所有参数则它们必须是一致的。
 */
export type YearInfoLike =
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
 * 必须提供 `month` 或 `monthCode`，如果提供了所有参数则它们必须是一致的。
 */
export type MonthInfoLike =
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
 * 可用于构造持续时间的对象
 */
export type InstantLike = Timestamp | BigIntTimestamp | Temporal.Instant;

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
 * 可用于构造时区感知日期时间的对象
 */
export type ZonedDateTimeLike = {
    instant: InstantLike;
} & TimeZoneInfoLike
    & Partial<CalendarInfoLike>;

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
export type CalendarInfoLike<T extends CalendarIdLike = CalendarIdLike> = {
    readonly calendar: T;
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
export type TimeZoneInfoLike<T extends TimeZoneIdLike = TimeZoneIdLike> = {
    readonly timeZone: T;
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
 * 可用于构造日期的对象
 */
export type DateLike = YearLike & MonthLike & DayLike;

/**
 * 可用于构造日期的对象
 */
export type DateInfoLike = YearInfoLike & MonthInfoLike & DayLike;

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
 * 时态信息
 */
export type TemporalInfo = DateTimeLike
    & EraYearLike
    & MonthCodeLike
    & CalendarInfoLike<CalendarId>
    & TimeZoneInfoLike<TimeZoneId>
    & UTCOffsetLike;

/**
 * 输入构造时态信息的对象
 */
export type TemporalInfoInput =
    | Rfc9557Text
    | InstantLike
    | TemporalObject
    | RequireLeastOneKey<
          Partial<
              DateTimeLike
                  & EraYearLike
                  & MonthCodeLike
                  & TimeZoneInfoLike
                  & TimeZoneLike
                  & CalendarInfoLike
                  & CalendarLike
                  & UTCOffsetLike
          >
      >;

/**
 * 输入构造日期的对象
 *
 * @see {@link DateInfoLike}
 * @see {@link CalendarInfoLike}
 */
export type DateInput = DateInfoLike & Partial<CalendarInfoLike | CalendarLike>;

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
    & (TimeZoneInfoLike | TimeZoneLike)
    & Partial<UTCOffsetLike>;

/**
 * 输入时间戳附加信息
 *
 * @see {@link AdditionalInfoLike}
 */
export type AdditionalInfoInput = Partial<AdditionalInfoLike>;

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
    | Temporal.ZonedDateTime
    | Temporal.PlainMonthDay
    | Temporal.PlainYearMonth;

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
 * 封装库所支持的输入类型与 {@link Temporal} 本身支持的类型有一些不一致，需通过该函数转换。
 *
 * 例如 {@link Temporal.ZonedDateTime.from} 支持 {@link Temporal.ZonedDateTimeLike}，但可能传入的输入是 {@link ZonedDateTimeInput} 类型。
 *
 * @internal
 */
export function toTemporalInput<
    T extends Partial<
        CalendarLike & CalendarInfoLike & TimeZoneLike & TimeZoneInfoLike
    >,
>(input: T): Temporal.ZonedDateTimeLike {
    // input 可能是 Temporal 对象，一般通过了类型检查就是支持传入的类型，所以只需要直接返回
    if (isTemporalObject(input)) {
        return input as Temporal.ZonedDateTimeLike;
    }

    const opts = Object.assign({}, input) as Mutable<T>;

    if (<keyof CalendarLike>"calendarId" in input) {
        opts.calendar = input.calendarId;
    }
    if (<keyof CalendarLike>"calendar" in input) {
        opts.calendar = toCalendarId(input.calendar);
    }
    if (<keyof TimeZoneLike>"timeZoneId" in input) {
        opts.timeZone = input.timeZoneId;
    }
    if (<keyof TimeZoneInfoLike>"timeZone" in input) {
        opts.timeZone = toTimeZoneId(input.timeZone);
    }

    return opts as Temporal.ZonedDateTimeLike;
}

// TODO: is 放到 predicate.ts 中
