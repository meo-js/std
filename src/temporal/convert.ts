import { Temporal } from "temporal-polyfill";
import type { Weaken } from "../ts.js";
import {
    toBigIntTimestamp,
    toCalendarId,
    toTimeZoneId,
    type BigIntTimestamp,
    type CalendarLike,
    type Timestamp,
    type TimeZoneLike,
} from "./shared.js";

/**
 * 将时间戳转换为 {@link Temporal.ZonedDateTime}
 *
 * @param timestamp 以毫秒或纳秒为单位的 Unix 时间戳
 * @param timeZone 时区
 * @param calendar 日历，默认为 `iso8601`
 */
export function toZonedDateTime(
    timestamp: Weaken<Timestamp | BigIntTimestamp>,
    timeZone: TimeZoneLike,
    calendar?: CalendarLike,
): Temporal.ZonedDateTime;
// export function toZonedDateTime(
//     rfcText: string,
//     timeZone: TimeZoneLike,
//     calendar?: CalendarLike,
// ): Temporal.ZonedDateTime;
export function toZonedDateTime(
    timestamp: Weaken<Timestamp | BigIntTimestamp>,
    timeZone: TimeZoneLike,
    calendar?: CalendarLike,
) {
    return new Temporal.ZonedDateTime(
        toBigIntTimestamp(timestamp),
        toTimeZoneId(timeZone),
        calendar ? toCalendarId(calendar) : undefined,
    );
}
