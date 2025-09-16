/**
 * HTTP date-time parsing and formatting implementation.
 * Supports RFC 1945/2616/7231/9110 specifications.
 *
 * Parsing: Accepts three formats (IMF-fixdate, RFC 850, asctime)
 * Formatting: Always outputs IMF-fixdate format in GMT
 *
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';
import { parseAsctime } from './common/asctime.js';
import { formatImfFixdate, parseImfFixdate } from './common/imf_fixdate.js';
import { parseMonth, parseWeekday } from './common/tokens.js';
import { validateDateTime } from './common/validate.js';
import { parseHttpRfc850Year } from './common/y2k.js';

/**
 * Format ZonedDateTime as HTTP-date string.
 * Always outputs IMF-fixdate format in GMT per RFC 9110.
 *
 * @param zdt ZonedDateTime to format
 * @returns HTTP-date string (IMF-fixdate format)
 */
export function format(zdt: Temporal.ZonedDateTime): string {
  return formatImfFixdate(zdt);
}

/**
 * Parse HTTP-date string to TemporalInfo.
 * Accepts three formats in order: IMF-fixdate, RFC 850, asctime.
 * Per RFC 9110, parsers MUST accept all three formats.
 *
 * @param text HTTP-date string
 * @param out Output TemporalInfo object to populate
 * @returns Populated TemporalInfo
 * @throws {RangeError} If none of the formats match
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  const trimmed = text.trim();

  // Try IMF-fixdate first (most common)
  try {
    const result = parseImfFixdate(trimmed);
    return populateTemporalInfo(out, result);
  } catch {
    // Continue to next format
  }

  // Try RFC 850 format
  try {
    const result = parseRfc850(trimmed);
    return populateTemporalInfo(out, result);
  } catch {
    // Continue to next format
  }

  // Try asctime format
  try {
    const result = parseAsctime(trimmed);
    return populateTemporalInfo(out, result);
  } catch {
    // All formats failed
  }

  throw new RangeError(`Invalid HTTP-date format: ${text}.`);
}

/**
 * Parse RFC 850 format used in HTTP.
 * Format: "Sunday, 06-Nov-94 08:49:37 GMT"
 *
 * @param text RFC 850 string
 * @returns Parsed date-time components
 * @throws {RangeError} If format is invalid
 */
function parseRfc850(text: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number;
  sourceTz: 'numeric' | 'obs-name';
} {
  // RFC 850 pattern: "Sunday, 06-Nov-94 08:49:37 GMT"
  const pattern =
    /^([A-Za-z]+),\s+(\d{2})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/u;

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
  ] = match;

  // Parse components
  const year = parseHttpRfc850Year(yearStr);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = Number.parseInt(secondStr, 10);

  // Validate components
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: false, // HTTP doesn't support leap seconds
    weekday: parseWeekday(weekdayStr),
    strictWeekday: false,
  });

  // RFC 850 in HTTP is always GMT
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetMinutes: 0,
    sourceTz: 'numeric',
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

  // HTTP dates are always GMT/UTC
  out.offset = '+00:00';
  out.timeZone = 'UTC';

  return out;
}
