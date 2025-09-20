/**
 * IMF-fixdate formatter for HTTP and Cookie date formats.
 * Implements the standard format: "Sun, 06 Nov 1994 08:49:37 GMT"
 * Used by HTTP Date headers and Cookie Expires fields.
 *
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import {
  formatMonth,
  formatWeekday,
  parseMonth,
  parseWeekday,
} from './tokens.js';
import { validateDateTime } from './validate.js';
import { formatYear } from './y2k.js';

/**
 * Format a ZonedDateTime as IMF-fixdate string.
 * Format: "wkday, DD Mon YYYY HH:MM:SS GMT"
 * Example: "Sun, 06 Nov 1994 08:49:37 GMT"
 *
 * This is the standard format for HTTP Date headers and Cookie Expires.
 * Always outputs GMT timezone regardless of input timezone.
 *
 * @param zdt ZonedDateTime to format (will be converted to UTC)
 * @returns IMF-fixdate string
 * @throws {RangeError} If date components are invalid
 */
export function formatImfFixdate(zdt: Temporal.ZonedDateTime): string {
  // Convert to UTC for consistent output
  const utc = zdt.withTimeZone('UTC');

  // Validate components
  validateDateTime(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second,
  );

  // Get day of week (Temporal: 1=Monday...7=Sunday)
  // Convert to our format (0=Sunday...6=Saturday)
  const dayOfWeek = utc.dayOfWeek === 7 ? 0 : utc.dayOfWeek;

  const wkday = formatWeekday(dayOfWeek);
  const day = String(utc.day).padStart(2, '0');
  const month = formatMonth(utc.month);
  const year = formatYear(utc.year);
  const hour = String(utc.hour).padStart(2, '0');
  const minute = String(utc.minute).padStart(2, '0');
  const second = String(utc.second).padStart(2, '0');

  return `${wkday}, ${day} ${month} ${year} ${hour}:${minute}:${second} GMT`;
}

/**
 * Parse IMF-fixdate string to date-time components.
 * Format: "wkday, DD Mon YYYY HH:MM:SS GMT"
 *
 * @param text IMF-fixdate string
 * @returns Parsed date-time components
 * @throws {RangeError} If format is invalid
 */
export function parseImfFixdate(text: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number;
  sourceTz: 'numeric' | 'obs-name';
} {
  // Regex for IMF-fixdate: "Sun, 06 Nov 1994 08:49:37 GMT"
  const pattern =
    /^([A-Za-z]{3}),\s+(\d{2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/u;

  const match = pattern.exec(text.trim());
  if (!match) {
    throw new RangeError(`Invalid IMF-fixdate format: ${text}.`);
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
  const year = Number.parseInt(yearStr, 10);
  const month = parseMonth(monthStr);
  const day = Number.parseInt(dayStr, 10);
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  const second = Number.parseInt(secondStr, 10);

  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: true,
    weekday: parseWeekday(weekdayStr),
    strictWeekday: true,
  });

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
