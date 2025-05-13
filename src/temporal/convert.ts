import { Temporal } from "temporal-polyfill";
import type {
    MapOf,
    Simplify,
    ToIntersection,
    ToUnion,
    Weaken,
} from "../ts.js";
import {
    toBigIntTimestamp,
    toCalendarId,
    toTimeZoneId,
    type BigIntTimestamp,
    type CalendarIdLike,
    type CalendarLike,
    type Rfc9557Text,
    type Timestamp,
    type TimeZoneIdLike,
    type TimeZoneLike,
} from "./shared.js";

/**
 * 将时间戳转换为 {@link Temporal.ZonedDateTime}
 *
 * @param timestamp 以毫秒或纳秒为单位的 Unix 时间戳
 * @param timeZone 时区
 * @param calendar 日历，默认为 `iso8601`
 */
// export function toZonedDateTime(
//     timestamp: Timestamp | BigIntTimestamp,
//     timeZone: TimeZoneIdLike,
//     calendar?: CalendarIdLike,
// ): Temporal.ZonedDateTime;
// export function toZonedDateTime(
//     info: Rfc9557Text | ,
// ): Temporal.ZonedDateTime;
// export function toZonedDateTime(
//     timestamp: Weaken<Timestamp | BigIntTimestamp>,
//     timeZone: TimeZoneLike,
//     calendar?: CalendarLike,
// ) {
//     return new Temporal.ZonedDateTime(
//         toBigIntTimestamp(timestamp),
//         toTimeZoneId(timeZone),
//         calendar ? toCalendarId(calendar) : undefined,
//     );
// }

// Temporal.ZonedDateTime.from(item)

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
