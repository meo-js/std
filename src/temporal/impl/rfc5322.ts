/**
 * RFC 5322 formatter for Email and Netnews date formats.
 * Implements modern RFC 5322 format with numeric timezone.
 * Used by Email Date headers and Netnews date fields.
 *
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';
import { roundToSecond } from './common/round.js';
import { formatOffset, normalizeRfc5322 } from './common/scanner.js';
import {
  formatMonth,
  formatWeekday,
  parseMonth,
  parseWeekday,
} from './common/tokens.js';
import type { FormatOptions } from './common/types.js';
import { parseTimezone } from './common/tzmap.js';
import { validateDateTime } from './common/validate.js';
import { formatYear, parseEmailYear } from './common/y2k.js';

/**
 * Format a ZonedDateTime as RFC 5322 string.
 * Format: "Tue, 01 Nov 2016 13:23:12 +0100"
 *
 * This is the modern format for Email and Netnews, always using numeric timezone.
 *
 * @param zdt ZonedDateTime to format
 * @param options Formatting options
 * @returns RFC 5322 string
 * @throws {RangeError} If date components are invalid
 */
export function format(
  zdt: Temporal.ZonedDateTime,
  options: FormatOptions = {},
): string {
  const {
    includeDayOfWeek = true,
    includeSeconds = true,
    colonInOffset = false,
  } = options;

  zdt = roundToSecond(zdt);

  // Validate components
  validateDateTime(
    zdt.year,
    zdt.month,
    zdt.day,
    zdt.hour,
    zdt.minute,
    zdt.second,
  );

  const parts: string[] = [];

  // Optional day of week
  if (includeDayOfWeek) {
    // Convert Temporal dayOfWeek (1=Monday...7=Sunday) to our format (0=Sunday...6=Saturday)
    const dayOfWeek = zdt.dayOfWeek === 7 ? 0 : zdt.dayOfWeek;
    parts.push(`${formatWeekday(dayOfWeek)}, `);
  }

  // Date components
  const day = String(zdt.day).padStart(2, '0');
  const month = formatMonth(zdt.month);
  const year = formatYear(zdt.year);

  parts.push(`${day} ${month} ${year} `);

  // Time components
  const hour = String(zdt.hour).padStart(2, '0');
  const minute = String(zdt.minute).padStart(2, '0');

  if (includeSeconds) {
    const second = String(zdt.second).padStart(2, '0');
    parts.push(`${hour}:${minute}:${second} `);
  } else {
    parts.push(`${hour}:${minute} `);
  }

  // Timezone offset (always numeric per RFC 5322)
  const offsetMinutes = Math.trunc(zdt.offsetNanoseconds / 60_000_000_000);
  const timezone = formatOffset(offsetMinutes, colonInOffset, false);
  parts.push(timezone);

  return parts.join('');
}

/**
 * Parse RFC 5322 string with full compatibility for obsolete forms.
 * Supports RFC 822/1123/2822/5322 variations.
 *
 * @param text RFC 5322 (or compatible) string
 * @param allowLeapSecond Whether to allow second=60
 * @returns Parsed date-time components
 * @throws {RangeError} If format is invalid
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
  allowLeapSecond = true,
): Partial<TemporalInfo> {
  // Normalize whitespace and comments
  const normalized = normalizeRfc5322(text);

  // RFC 5322 pattern with optional day-of-week
  const pattern =
    /^(?:([A-Za-z]{3}),\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([^\s]+)$/u;

  const match = pattern.exec(normalized);
  if (!match) {
    throw new RangeError(`Invalid RFC 5322 date-time: ${text}.`);
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
  const year = parseEmailYear(yearStr);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = secondStr ? Number.parseInt(secondStr, 10) : 0;

  // Parse timezone
  const { offsetMinutes, sourceTz } = parseTimezone(tzStr);

  // Validate components
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond,
    weekday: weekdayStr ? parseWeekday(weekdayStr) : undefined,
    strictWeekday: false, // Be lenient with weekday mismatches
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

  // Convert offset to RFC 9557 format
  const numericOffset = formatOffset(offsetMinutes, true, false);
  out.offset = numericOffset;

  // Use fixed-offset timezone for ZDT construction
  out.timeZone = numericOffset;

  return out;
}
