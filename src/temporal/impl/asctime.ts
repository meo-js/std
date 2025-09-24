/**
 * Asctime format parser for HTTP legacy date format.
 * Implements parsing of C asctime() format used in old HTTP implementations.
 * Format: "Sun Nov  6 08:49:37 1994" (note the two spaces for single-digit day)
 *
 * @internal
 * @module
 */
import type { TemporalInfo } from '../shared.js';
import { normalizeAsctime } from './common/scanner.js';
import { parseMonth, parseWeekday } from './common/tokens.js';
import { validateDateTime } from './common/validate.js';

/**
 * Parse asctime format string to date-time components.
 * Format: "wkday Mon _D HH:MM:SS YYYY"
 * Where _D is day with leading space for single digits (e.g., " 6" or "16")
 *
 * Note: Asctime format has no timezone information, so it's interpreted as GMT/UTC.
 *
 * @param text Asctime string
 * @returns Parsed date-time components (always UTC)
 * @throws {RangeError} If format is invalid
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  // Normalize spaces while preserving structure
  const normalized = normalizeAsctime(text);

  // Asctime pattern: "Sun Nov  6 08:49:37 1994"
  // Note: day can be single digit with leading space
  const pattern =
    /^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\d{4})$/u;

  const match = pattern.exec(normalized);
  if (!match) {
    throw new RangeError(`Invalid asctime format: ${text}.`);
  }

  const [
    ,
    weekdayStr,
    monthStr,
    dayStr,
    hourStr,
    minuteStr,
    secondStr,
    yearStr,
  ] = match;

  // Parse components
  const year = Number.parseInt(yearStr, 10);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = Number.parseInt(secondStr, 10);

  // Validate components (no leap seconds in asctime)
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: false,
    weekday: parseWeekday(weekdayStr),
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

  // Asctime has no timezone info, interpret as GMT/UTC
  out.offset = '+00:00';
  out.timeZone = 'UTC';

  return out;
}
