/**
 * Netnews/Usenet date-time parsing and formatting implementation.
 * Supports RFC 850/1036/5536 specifications.
 *
 * Parsing: RFC 5322 format with additional acceptance of GMT obs-zone and legacy formats
 * Formatting: Modern RFC 5322 format with numeric timezone
 *
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';
import { formatRfc5322, parseRfc5322 } from './common/rfc5322.js';
import { formatOffset } from './common/scanner.js';
import { parseMonth, parseWeekday } from './common/tokens.js';
import { parseTimezone } from './common/tzmap.js';
import { validateDateTime } from './common/validate.js';
import { parseNetnewsYear } from './common/y2k.js';

/**
 * Format ZonedDateTime as Netnews date string.
 * Uses modern RFC 5322 format with numeric timezone per RFC 5536.
 *
 * @param zdt ZonedDateTime to format
 * @returns Netnews date string (RFC 5322 format)
 */
export function format(zdt: Temporal.ZonedDateTime): string {
  return formatRfc5322(zdt, {
    includeDayOfWeek: true,
    includeSeconds: true,
    colonInOffset: false,
  });
}

/**
 * Parse Netnews date string to TemporalInfo.
 * Accepts RFC 5322 format with additional support for GMT obs-zone per RFC 5536.
 * Also supports legacy RFC 850 and RFC 1036 formats for compatibility.
 *
 * @param text Netnews date string
 * @param out Output TemporalInfo object to populate
 * @returns Populated TemporalInfo
 * @throws {RangeError} If parsing fails
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  try {
    // Try standard RFC 5322 parsing first
    const result = parseRfc5322(text, true); // Allow leap seconds
    return populateTemporalInfo(out, result);
  } catch {
    // RFC 5322 parsing failed, try legacy formats
    return parseLegacyFormats(text, out);
  }
}

/**
 * Parse legacy Netnews formats (RFC 850, RFC 1036).
 *
 * @param text Netnews date string
 * @param out Output TemporalInfo object
 * @returns Populated TemporalInfo
 * @throws {RangeError} If parsing fails
 */
function parseLegacyFormats(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  const trimmed = text.trim();

  // Try RFC 850 format: "Friday, 19-Nov-82 16:14:55 EST"
  try {
    const result = parseRfc850Format(trimmed);
    return populateTemporalInfo(out, result);
  } catch {
    // Continue to next format
  }

  // Special case: handle unknown timezones as +0000 (per RFC 5536)
  try {
    const result = parseWithUnknownTimezone(trimmed);
    return populateTemporalInfo(out, result);
  } catch {
    // Continue to final error
  }

  // Special case: replace GMT with +0000 and try again
  const gmtPattern = /\bGMT\b/gu;
  if (gmtPattern.test(text)) {
    const modifiedText = text.replace(gmtPattern, '+0000');
    try {
      const result = parseRfc5322(modifiedText, true);
      return populateTemporalInfo(out, result);
    } catch {
      // Still failed, fall through to error
    }
  }

  throw new RangeError(`Invalid Netnews date format: ${text}.`);
}

/**
 * Parse RFC 850 format: "Weekday, DD-Mon-YY HH:MM:SS TIMEZONE"
 *
 * @param text RFC 850 formatted date string
 * @returns Parsed date-time components
 */
function parseRfc850Format(text: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number;
  sourceTz: 'numeric' | 'obs-name';
} {
  // RFC 850 pattern: "Friday, 19-Nov-82 16:14:55 EST"
  const pattern =
    /^([A-Za-z]+),\s*(\d{1,2})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+([^\s]+)$/u;

  const match = pattern.exec(text);
  if (!match) {
    throw new RangeError(`Invalid RFC 850 format: ${text}.`);
  }

  const [
    ,
    weekdayStr,
    dayStr,
    monthStr,
    yearStr,
    hourStr,
    minuteStr,
    secondStr,
    tzStr,
  ] = match;

  // Parse components
  const year = parseNetnewsYear(yearStr);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = Number.parseInt(secondStr, 10);

  // Parse timezone
  const { offsetMinutes, sourceTz } = parseTimezone(tzStr);

  // Validate components (be lenient with weekday mismatch)
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: true,
    weekday: parseWeekday(weekdayStr),
    strictWeekday: false,
  });

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetMinutes,
    sourceTz,
  };
}

/**
 * Parse date with unknown timezone as +0000 per RFC 5536.
 *
 * @param text Date string with potentially unknown timezone
 * @returns Parsed date-time components
 */
function parseWithUnknownTimezone(text: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number;
  sourceTz: 'numeric' | 'obs-name';
} {
  // Try to match a general pattern and replace unknown timezone with +0000
  const generalPattern =
    /^(?:([A-Za-z]{3}),?\s*)?(\d{1,2})[\s-]([A-Za-z]{3})[\s-](\d{2,4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([^\s]+)$/u;

  const match = generalPattern.exec(text);
  if (!match) {
    throw new RangeError(`Invalid general date format: ${text}.`);
  }

  const [
    ,
    weekdayStr,
    dayStr,
    monthStr,
    yearStr,
    hourStr,
    minuteStr,
    secondStr,
    tzStr,
  ] = match;

  // Try to parse timezone, if it fails assume unknown timezone = +0000
  let offsetMinutes: number;
  let sourceTz: 'numeric' | 'obs-name';

  try {
    const tzResult = parseTimezone(tzStr);
    offsetMinutes = tzResult.offsetMinutes;
    sourceTz = tzResult.sourceTz;
  } catch {
    // Unknown timezone, treat as +0000 per RFC 5536
    offsetMinutes = 0;
    sourceTz = 'numeric';
  }

  // Parse other components
  const year = parseNetnewsYear(yearStr);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = secondStr ? Number.parseInt(secondStr, 10) : 0;

  // Validate components
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: true,
    weekday: weekdayStr ? parseWeekday(weekdayStr) : undefined,
    strictWeekday: false,
  });

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetMinutes,
    sourceTz,
  };
}

/**
 * Populate TemporalInfo from parsed date-time components.
 *
 * @param out Output TemporalInfo object
 * @param parsed Parsed date-time components
 * @returns Populated TemporalInfo
 */
function populateTemporalInfo(
  out: Partial<TemporalInfo>,
  parsed: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    offsetMinutes: number;
    sourceTz: 'numeric' | 'obs-name';
  },
): Partial<TemporalInfo> {
  out.year = parsed.year;
  out.era = undefined;
  out.eraYear = undefined;
  out.month = parsed.month;
  out.monthCode = undefined;
  out.day = parsed.day;
  out.hour = parsed.hour;
  out.minute = parsed.minute;
  out.second = parsed.second;
  out.millisecond = 0;
  out.microsecond = 0;
  out.nanosecond = 0;

  // Convert offset to RFC 9557 format
  const numericOffset = formatOffset(parsed.offsetMinutes, true, false);
  out.offset = numericOffset;

  // Use fixed-offset timezone for ZDT construction
  out.timeZone = numericOffset;

  return out;
}
