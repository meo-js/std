import { Temporal } from "temporal-polyfill";
import type { OmitValue } from "../object.js";
import { isInstant } from "../predicate.js";
import type {
    MapOf,
    Simplify,
    ToIntersection,
    ToUnion,
    Weaken,
} from "../ts.js";
import {
    toCalendarId,
    toTemporalInput,
    toTimeZoneId,
    type BigIntTimestamp,
    type CalendarId,
    type CalendarIdLike,
    type CalendarInfoLike,
    type DateTimeLike,
    type InstantLike,
    type Rfc9557Text,
    type TemporalInfo,
    type TemporalInfoInput,
    type Timestamp,
    type TimeZoneId,
    type TimeZoneIdLike,
    type TimeZoneInfoLike,
    type UTCOffsetLike,
    type ZonedAssignmentOptions,
    type ZonedDateTimeInput,
} from "./shared.js";

/**
 * 将时间戳转换为 {@link Temporal.ZonedDateTime}
 *
 * @param instant 以毫秒 {@link Timestamp}、纳秒 {@link BigIntTimestamp} 为单位的 Unix 时间戳或者 {@link Temporal.Instant} 对象
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
 * @param input 包含日期与时区标注的 RFC 9557 格式字符串或对象
 * @param opts {@link ZonedAssignmentOptions}
 */
export function toZonedDateTime(
    input: Rfc9557Text | ZonedDateTimeInput,
    opts?: ZonedAssignmentOptions,
): Temporal.ZonedDateTime;
export function toZonedDateTime(
    arg1: InstantLike | Rfc9557Text | ZonedDateTimeInput,
    arg2?: TimeZoneIdLike | ZonedAssignmentOptions,
    calendar?: CalendarIdLike,
) {
    const type = typeof arg1;

    switch (type) {
        case "number": {
            let dateTime = Temporal.Instant.fromEpochMilliseconds(
                arg1 as Timestamp,
            ).toZonedDateTimeISO(toTimeZoneId(arg2 as TimeZoneIdLike));
            if (calendar != null) {
                dateTime = dateTime.withCalendar(toCalendarId(calendar));
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
                let dateTime = arg1.toZonedDateTimeISO(
                    toTimeZoneId(arg2 as TimeZoneIdLike),
                );
                if (calendar != null) {
                    dateTime = dateTime.withCalendar(toCalendarId(calendar));
                }
                return dateTime;
            } else {
                return Temporal.ZonedDateTime.from(
                    toTemporalInput(arg1 as ZonedDateTimeInput),
                    arg2 as ZonedAssignmentOptions,
                );
            }
        }
    }
}

toZonedDateTime({ year: 1, day: 1, month: 1, timeZone: "1" });

// TODO 一个通用的 parse(...things) -> {time,date,...} 函数，有啥用啥

// export function test<const T extends unknown[], R = _Check<T>>(
//     ...args: T
// ): Check<T> {
//     // ye.
// }

// test(1, 1, 3);

type Check<T extends readonly unknown[]> =
    _Check<T> extends Need ? Temporal.ZonedDateTime : never;

type _Check<T extends readonly unknown[]> = Simplify<
    ToIntersection<ToUnion<T> extends infer V ? Str<V> | Num<V> : never>
>;

type Test = Simplify<ToIntersection<_Check<["asdf", 1, { year: 1 }]>>>;

type Need = Required<Temporal.ZonedDateTimeLike>;
type Str<T> = MapOf<T, string, Need>;
type Num<T> = MapOf<
    T,
    Weaken<Timestamp | BigIntTimestamp>,
    Required<{
        readonly epochMilliseconds: number;
        readonly epochNanoseconds: bigint;
    }>
>;

/**
 * 将多个输入组合解析为时态信息
 */
export function toTemporalInfo<
    T extends TemporalInfoInput,
    Rest extends TemporalInfoInput[],
>(input: T, ...args: Rest): Return<T | ToUnion<Rest>> {
    // TODO
    return undefined!;
}

const a = toTemporalInfo("asdf", 121);

type Return<T extends TemporalInfoInput> = Simplify<
    ToIntersection<
        InputToObject<T> extends infer V ? OmitValue<V, undefined> : never
    >
>;

type InputToObject<T extends TemporalInfoInput> = T extends string
    ? Partial<
          DateTimeLike
              & CalendarInfoLike<CalendarId>
              & TimeZoneInfoLike<TimeZoneId>
              & UTCOffsetLike
      >
    : T extends Timestamp | BigIntTimestamp
      ? DateTimeLike
      : T extends TemporalInfoInput
        ? Partial<TemporalInfo>
        : never;
