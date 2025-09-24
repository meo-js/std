/**
 * @internal
 * @module
 */

import type { TemporalInfo } from '../shared.js';
import { formatOffset } from './common/scanner.js';
import { parseMonth, parseWeekday } from './common/tokens.js';
import { parseTimezone } from './common/tzmap.js';
import { validateDateTime } from './common/validate.js';
import { parseHttpRfc850Year, parseNetnewsYear } from './common/y2k.js';

export interface Rfc850ParseOptions {
  // If true, require literal GMT token and fix output to UTC.
  requireGMT?: boolean;
  // If true, require day-of-month to be exactly two digits (e.g., 06).
  enforceTwoDigitDay?: boolean;
  // If true, enforce case-sensitive tokens (e.g., Sunday, Nov).
  caseSensitiveTokens?: boolean;
  // If true, allow leap second value 60; otherwise reject.
  allowLeapSecond?: boolean;
  // If true, interpret 2-digit year per HTTP rules; otherwise use Netnews/Email rules.
  useHttpTwoDigitYear?: boolean;
}

/**
 * Parse RFC 850 format: "Weekday, DD-Mon-YY HH:MM:SS TIMEZONE"
 *
 * @param text RFC 850 formatted date string
 * @returns Parsed date-time components
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
  options?: Rfc850ParseOptions,
): Partial<TemporalInfo> {
  const requireGMT = options?.requireGMT ?? false;
  const enforceTwoDigitDay = options?.enforceTwoDigitDay ?? false;
  const caseSensitiveTokens = options?.caseSensitiveTokens ?? false;
  const allowLeapSecond = options?.allowLeapSecond ?? true;
  const useHttpTwoDigitYear = options?.useHttpTwoDigitYear ?? false;
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
  const year = useHttpTwoDigitYear
    ? parseHttpRfc850Year(yearStr)
    : parseNetnewsYear(yearStr);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = Number.parseInt(secondStr, 10);

  // Optional strict checks commonly required by HTTP-date.
  if (requireGMT && tzStr !== 'GMT') {
    throw new RangeError(`Invalid RFC 850 format: ${text}.`);
  }
  if (enforceTwoDigitDay && dayStr.length !== 2) {
    throw new RangeError(`Invalid RFC 850 format: ${text}.`);
  }
  if (caseSensitiveTokens) {
    if (!/^[A-Z][a-z]+$/u.test(weekdayStr)) {
      throw new RangeError(`Invalid RFC 850 format: ${text}.`);
    }
    if (!/^[A-Z][a-z]{2}$/u.test(monthStr)) {
      throw new RangeError(`Invalid RFC 850 format: ${text}.`);
    }
  }

  // Parse timezone or fix to GMT/UTC.
  const offsetMinutes = requireGMT ? 0 : parseTimezone(tzStr).offsetMinutes;

  // Validate components (be lenient with weekday mismatch)
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond,
    weekday: parseWeekday(weekdayStr),
    strictWeekday: false,
  });

  out.year = year;
  out.era = undefined;
  out.eraYear = undefined;
  out.month = month;
  out.monthCode = undefined;
  out.day = day;
  out.hour = hour;
  out.minute = minute;
  out.second = second;
  out.millisecond = 0;
  out.microsecond = 0;
  out.nanosecond = 0;

  if (requireGMT) {
    out.offset = '+00:00';
    out.timeZone = 'UTC';
  } else {
    const numericOffset = formatOffset(offsetMinutes, true, false);
    out.offset = numericOffset;
    out.timeZone = numericOffset;
  }

  return out;
}
