/**
 * @module
 *
 * @internal
 */
// from https://github.com/js-temporal/temporal-polyfill/blob/main/lib/regex.ts

const offsetIdentifierNoCapture =
    /(?:[+-](?:[01][0-9]|2[0-3])(?::?[0-5][0-9])?)/u;
const tzComponent = /[A-Za-z._][A-Za-z._0-9+-]*/u;
const timeZoneID = new RegExp(
    `(?:${offsetIdentifierNoCapture.source}|(?:${tzComponent.source})(?:\\/(?:${tzComponent.source}))*)`,
    "u",
);

const yearpart = /(?:[+-]\d{6}|\d{4})/u;
const monthpart = /(?:0[1-9]|1[0-2])/u;
const daypart = /(?:0[1-9]|[12]\d|3[01])/u;
const datesplit = new RegExp(
    `(${yearpart.source})(?:-(${monthpart.source})-(${daypart.source})|(${monthpart.source})(${daypart.source}))`,
    "u",
);
const timesplit =
    /(\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?|(\d{2})(?:(\d{2})(?:[.,](\d{1,9}))?)?)?/u;
const offsetWithParts =
    /([+-])([01][0-9]|2[0-3])(?::?([0-5][0-9])(?::?([0-5][0-9])(?:[.,](\d{1,9}))?)?)?/u;
const offset =
    /((?:[+-])(?:[01][0-9]|2[0-3])(?::?(?:[0-5][0-9])(?::?(?:[0-5][0-9])(?:[.,](?:\d{1,9}))?)?)?)/u;
const offsetpart = new RegExp(`([zZ])|${offset.source}?`, "u");
const offsetIdentifier = /([+-])([01][0-9]|2[0-3])(?::?([0-5][0-9])?)?/u;
const annotation =
    /\[(!)?([a-z_][a-z0-9_-]*)=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\]/gu;

const zoneddatetime = new RegExp(
    [
        `^${datesplit.source}`,
        `(?:(?:[tT]|\\s+)${timesplit.source}(?:${offsetpart.source})?)?`,
        `(?:\\[!?(${timeZoneID.source})\\])?`,
        `((?:${annotation.source})*)$`,
    ].join(""),
    "u",
);

const time = new RegExp(
    [
        `^[tT]?${timesplit.source}`,
        `(?:${offsetpart.source})?`,
        `(?:\\[!?(${timeZoneID.source})\\])?`,
        `((?:${annotation.source})*)$`,
    ].join(""),
    "u",
);

// The short forms of YearMonth and MonthDay are only for the ISO calendar, but
// annotations are still allowed, and will throw if the calendar annotation is
// not ISO.
// Non-ISO calendar YearMonth and MonthDay have to parse as a Temporal.PlainDate,
// with the reference fields.
// YYYYMM forbidden by ISO 8601 because ambiguous with YYMMDD, but allowed by
// RFC 3339 and we don't allow 2-digit years, so we allow it.
// Not ambiguous with HHMMSS because that requires a 'T' prefix
// UTC offsets are not allowed, because they are not allowed with any date-only
// format; also, YYYY-MM-UU is ambiguous with YYYY-MM-DD
const yearmonth = new RegExp(
    `^(${yearpart.source})-?(${monthpart.source})(?:\\[!?${timeZoneID.source}\\])?((?:${annotation.source})*)$`,
    "u",
);
const monthday = new RegExp(
    `^(?:--)?(${monthpart.source})-?(${daypart.source})(?:\\[!?${timeZoneID.source}\\])?((?:${annotation.source})*)$`,
    "u",
);

const fraction = /(\d+)(?:[.,](\d{1,9}))?/u;

const durationDate = /(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/u;
const durationTime = new RegExp(
    `(?:${fraction.source}H)?(?:${fraction.source}M)?(?:${fraction.source}S)?`,
    "u",
);
const duration = new RegExp(
    `^([+-])?P${durationDate.source}(?:T(?!$)${durationTime.source})?$`,
    "iu",
);

const standardDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const leapYearDaysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export type RFC9557ParseResult = (
    | { year: undefined; month: undefined; day: undefined }
    | { year: number; month: number; day: undefined }
    | { year: undefined; month: number; day: number }
    | { year: number; month: number; day: number }
)
    & (
        | {
              hour: number;
              minute: number;
              second: number;
              millisecond: number;
              microsecond: number;
              nanosecond: number;
          }
        | {
              hour: undefined;
              minute: undefined;
              second: undefined;
              millisecond: undefined;
              microsecond: undefined;
              nanosecond: undefined;
          }
    ) & {
        offset: string | undefined;
        z: boolean;
        timeZone: string | undefined;
        calendar: string | undefined;
    };

export type ISO8601ParseResult = {
    years: number;
    months: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
};

function processAnnotations(annotations: string) {
    let calendar;
    let calendarWasCritical = false;
    // Avoid the user code minefield of matchAll.
    let match;
    annotation.lastIndex = 0;
    while ((match = annotation.exec(annotations))) {
        const { 1: critical, 2: key, 3: value } = match;
        if (key === "u-ca") {
            if (calendar === undefined) {
                calendar = value;
                calendarWasCritical = critical === "!";
            } else if (critical === "!" || calendarWasCritical) {
                throw new RangeError(
                    `invalid annotations in ${annotations}: more than one u-ca present with critical flag.`,
                );
            }
        } else if (critical === "!") {
            throw new RangeError(`unrecognized annotation: !${key}=${value}.`);
        }
    }
    return calendar;
}

function isLeapYear(year: number | undefined) {
    if (undefined === year) return false;
    const isDiv4 = year % 4 === 0;
    const isDiv100 = year % 100 === 0;
    const isDiv400 = year % 400 === 0;
    return isDiv4 && (!isDiv100 || isDiv400);
}

function getISODaysInMonth(year: number, month: number) {
    if (isLeapYear(year)) {
        return leapYearDaysInMonth[month - 1];
    } else {
        return standardDaysInMonth[month - 1];
    }
}

function rejectRange(value: number, min: number, max: number) {
    if (value < min || value > max) {
        throw new RangeError(
            `value out of range: ${min} <= ${value} <= ${max}.`,
        );
    }
}

function rejectTime(
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    nanosecond: number,
) {
    rejectRange(hour, 0, 23);
    rejectRange(minute, 0, 59);
    rejectRange(second, 0, 59);
    rejectRange(millisecond, 0, 999);
    rejectRange(microsecond, 0, 999);
    rejectRange(nanosecond, 0, 999);
}

function rejectDateTime(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    nanosecond: number,
) {
    rejectRange(month, 1, 12);
    rejectRange(day, 1, getISODaysInMonth(year, month));
    rejectTime(hour, minute, second, millisecond, microsecond, nanosecond);
}

function rejectDifferentSign(prop: number, sign: -1 | 0 | 1): -1 | 0 | 1 {
    if (prop === Infinity || prop === -Infinity)
        throw new RangeError("infinite values not allowed as duration fields.");
    if (prop !== 0) {
        const _prop = prop < 0 ? -1 : 1;
        if (sign !== 0 && _prop !== sign)
            throw new RangeError(
                "mixed-sign values not allowed as duration fields.",
            );
        return _prop;
    }
    return sign;
}

function rejectDuration(
    y: number,
    mon: number,
    w: number,
    d: number,
    h: number,
    min: number,
    s: number,
    ms: number,
    µs: number,
    ns: number,
) {
    let sign: -1 | 0 | 1 = 0;

    sign = rejectDifferentSign(y, sign);
    sign = rejectDifferentSign(mon, sign);
    sign = rejectDifferentSign(w, sign);
    sign = rejectDifferentSign(d, sign);
    sign = rejectDifferentSign(h, sign);
    sign = rejectDifferentSign(min, sign);
    sign = rejectDifferentSign(s, sign);
    sign = rejectDifferentSign(ms, sign);
    sign = rejectDifferentSign(µs, sign);
    sign = rejectDifferentSign(ns, sign);

    if (
        Math.abs(y) >= 2 ** 32
        || Math.abs(mon) >= 2 ** 32
        || Math.abs(w) >= 2 ** 32
    ) {
        throw new RangeError("years, months, and weeks must be < 2³².");
    }

    const msResult = truncatingDivModByPowerOf10(ms, 3);
    const µsResult = truncatingDivModByPowerOf10(µs, 6);
    const nsResult = truncatingDivModByPowerOf10(ns, 9);
    const remainderSec = truncatingDivModByPowerOf10(
        msResult.mod * 1e6 + µsResult.mod * 1e3 + nsResult.mod,
        9,
    ).div;
    const totalSec =
        d * 86400
        + h * 3600
        + min * 60
        + s
        + msResult.div
        + µsResult.div
        + nsResult.div
        + remainderSec;
    if (!Number.isSafeInteger(totalSec)) {
        throw new RangeError(
            "total of duration time units cannot exceed 9007199254740991.999999999 s.",
        );
    }
}

function throwDateTimeError(text: string): never {
    throw new RangeError(`invalid RFC 9557 string: ${text}.`);
}

function throwDurationError(text: string): never {
    throw new RangeError(`invalid duration: ${text}.`);
}

function throwFractionalError(): never {
    throw new RangeError("only the smallest unit can be fractional.");
}

function parseTime(text: string, out: RFC9557ParseResult): RFC9557ParseResult {
    const match = time.exec(text);
    if (!match) {
        throwDateTimeError(text);
    }

    const calendar = processAnnotations(match[11]);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const hour = +(match[1] ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const minute = +(match[2] ?? match[5] ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    let second = +(match[3] ?? match[6] ?? 0);
    if (second === 60) second = 59;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, prefer-template -- checked.
    const fraction = (match[4] ?? match[7] ?? "") + "000000000";
    const millisecond = +fraction.slice(0, 3);
    const microsecond = +fraction.slice(3, 6);
    const nanosecond = +fraction.slice(6, 9);

    let offset;
    let z = false;
    if (match[8]) {
        offset = undefined;
        z = true;
    } else if (match[9]) {
        offset = match[9];
    }

    const timeZone = match[10];

    rejectTime(hour, minute, second, millisecond, microsecond, nanosecond);

    out.year = undefined;
    out.month = undefined;
    out.day = undefined;
    out.hour = hour;
    out.minute = minute;
    out.second = second;
    out.millisecond = millisecond;
    out.microsecond = microsecond;
    out.nanosecond = nanosecond;
    out.offset = offset;
    out.z = z;
    out.timeZone = timeZone;
    out.calendar = calendar;

    return out;
}

function parseYearMonth(
    text: string,
    out: RFC9557ParseResult,
): RFC9557ParseResult {
    const match = yearmonth.exec(text);
    if (!match) {
        return parseMonthDay(text, out);
    }

    const calendar = processAnnotations(match[3]);
    const yearString = match[1];
    if (yearString === "-000000") {
        throwDateTimeError(text);
    }
    const year = +yearString;
    const month = +match[2];

    out.year = year;
    out.month = month;
    out.day = undefined;
    out.hour = undefined;
    out.minute = undefined;
    out.second = undefined;
    out.millisecond = undefined;
    out.microsecond = undefined;
    out.nanosecond = undefined;
    out.offset = undefined;
    out.z = false;
    out.timeZone = undefined;
    out.calendar = calendar;

    return out;
}

function parseMonthDay(
    text: string,
    out: RFC9557ParseResult,
): RFC9557ParseResult {
    const match = monthday.exec(text);
    if (!match) {
        return parseTime(text, out);
    }

    const calendar = processAnnotations(match[3]);
    const month = +match[1];
    const day = +match[2];

    out.year = undefined;
    out.month = month;
    out.day = day;
    out.hour = undefined;
    out.minute = undefined;
    out.second = undefined;
    out.millisecond = undefined;
    out.microsecond = undefined;
    out.nanosecond = undefined;
    out.offset = undefined;
    out.z = false;
    out.timeZone = undefined;
    out.calendar = calendar;

    return out;
}

function truncatingDivModByPowerOf10(xParam: number, p: number) {
    let x = xParam;
    if (x === 0) return { div: x, mod: x }; // preserves signed zero

    const sign = Math.sign(x);
    x = Math.abs(x);

    const xDigits = Math.trunc(1 + Math.log10(x));
    if (p >= xDigits) return { div: sign * 0, mod: sign * x };
    if (p === 0) return { div: sign * x, mod: sign * 0 };

    // would perform nearest rounding if x was not an integer:
    const xStr = x.toPrecision(xDigits);
    const div = sign * Number.parseInt(xStr.slice(0, xDigits - p), 10);
    const mod = sign * Number.parseInt(xStr.slice(xDigits - p), 10);

    return { div, mod };
}

function toIntegerWithTruncation(value: unknown): number {
    const number = Number(value);
    if (number === 0) return 0;
    if (Number.isNaN(number) || number === Infinity || number === -Infinity) {
        throw new RangeError("invalid number value.");
    }
    const integer = Math.trunc(number);
    if (integer === 0) return 0; // ℝ(value) in spec text; converts -0 to 0
    return integer;
}

export function createRfc9557ParseResult(): RFC9557ParseResult {
    return {
        year: 1972,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
        offset: undefined,
        z: false,
        timeZone: undefined,
        calendar: undefined,
    };
}

export function createIso8601ParseResult(): ISO8601ParseResult {
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

export function parseDateTime(
    text: string,
    out: RFC9557ParseResult,
): RFC9557ParseResult {
    const match = zoneddatetime.exec(text);
    if (!match) {
        return parseYearMonth(text, out);
    }

    const yearString = match[1];
    if (yearString === "-000000") {
        throwDateTimeError(text);
    }

    const calendar = processAnnotations(match[16]);
    const year = +yearString;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const month = +(match[2] ?? match[4] ?? 1);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const day = +(match[3] ?? match[5] ?? 1);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const hasTime = match[6] !== undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const hour = +(match[6] ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    const minute = +(match[7] ?? match[10] ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    let second = +(match[8] ?? match[11] ?? 0);
    if (second === 60) second = 59;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, prefer-template -- checked.
    const fraction = (match[9] ?? match[12] ?? "") + "000000000";
    const millisecond = +fraction.slice(0, 3);
    const microsecond = +fraction.slice(3, 6);
    const nanosecond = +fraction.slice(6, 9);

    let offset;
    let z = false;
    if (match[13]) {
        offset = undefined;
        z = true;
    } else if (match[14]) {
        offset = match[14];
    }

    const timeZone = match[15];

    rejectDateTime(
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond,
        microsecond,
        nanosecond,
    );

    out.year = year;
    out.month = month;
    out.day = day;
    if (hasTime) {
        out.hour = hour;
        out.minute = minute;
        out.second = second;
        out.millisecond = millisecond;
        out.microsecond = microsecond;
        out.nanosecond = nanosecond;
    } else {
        out.hour = undefined;
        out.minute = undefined;
        out.second = undefined;
        out.millisecond = undefined;
        out.microsecond = undefined;
        out.nanosecond = undefined;
    }
    out.offset = offset;
    out.z = z;
    out.timeZone = timeZone;
    out.calendar = calendar;
    return out;
}

export function parseDuration(
    text: string,
    out: ISO8601ParseResult,
): ISO8601ParseResult {
    const match = duration.exec(text);
    if (!match) {
        throwDurationError(text);
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    if (match.every((part, i) => i < 2 || part === undefined)) {
        throwDurationError(text);
    }

    const sign = match[1] === "-" ? -1 : 1;
    const years =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        match[2] === undefined ? 0 : toIntegerWithTruncation(match[2]) * sign;
    const months =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        match[3] === undefined ? 0 : toIntegerWithTruncation(match[3]) * sign;
    const weeks =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        match[4] === undefined ? 0 : toIntegerWithTruncation(match[4]) * sign;
    const days =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        match[5] === undefined ? 0 : toIntegerWithTruncation(match[5]) * sign;
    const hours =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        match[6] === undefined ? 0 : toIntegerWithTruncation(match[6]) * sign;
    const fHours = match[7];
    const minutesStr = match[8];
    const fMinutes = match[9];
    const secondsStr = match[10];
    const fSeconds = match[11];
    let minutes = 0;
    let seconds = 0;
    // fractional hours, minutes, or seconds, expressed in whole nanoseconds:
    let excessNanoseconds = 0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
    if (fHours !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        if (minutesStr ?? fMinutes ?? secondsStr ?? fSeconds ?? false) {
            throwFractionalError();
        }
        excessNanoseconds =
            toIntegerWithTruncation(`${fHours}000000000`.slice(0, 9))
            * 3600
            * sign;
    } else {
        minutes =
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
            minutesStr === undefined
                ? 0
                : toIntegerWithTruncation(minutesStr) * sign;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        if (fMinutes !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
            if (secondsStr ?? fSeconds ?? false) {
                throwFractionalError();
            }
            excessNanoseconds =
                toIntegerWithTruncation(`${fMinutes}000000000`.slice(0, 9))
                * 60
                * sign;
        } else {
            seconds =
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
                secondsStr === undefined
                    ? 0
                    : toIntegerWithTruncation(secondsStr) * sign;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
            if (fSeconds !== undefined) {
                excessNanoseconds =
                    toIntegerWithTruncation(`${fSeconds}000000000`.slice(0, 9))
                    * sign;
            }
        }
    }

    const nanoseconds = excessNanoseconds % 1000;
    const microseconds = Math.trunc(excessNanoseconds / 1000) % 1000;
    const milliseconds = Math.trunc(excessNanoseconds / 1e6) % 1000;
    seconds += Math.trunc(excessNanoseconds / 1e9) % 60;
    minutes += Math.trunc(excessNanoseconds / 60e9);

    rejectDuration(
        years,
        months,
        weeks,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
        microseconds,
        nanoseconds,
    );

    out.years = years;
    out.months = months;
    out.weeks = weeks;
    out.days = days;
    out.hours = hours;
    out.minutes = minutes;
    out.seconds = seconds;
    out.milliseconds = milliseconds;
    out.microseconds = microseconds;
    out.nanoseconds = nanoseconds;

    return out;
}
