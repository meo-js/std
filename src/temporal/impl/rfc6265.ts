/**
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';
import { tokenizeCookie } from './common/scanner.js';
import { parseMonth } from './common/tokens.js';
import { validateDateTime } from './common/validate.js';
import { parseCookieYear } from './common/y2k.js';
import * as imf_fixdate from './imf_fixdate.js';

/**
 * Format ZonedDateTime as Cookie date string.
 * Always outputs sane-cookie-date format (IMF-fixdate + GMT) per RFC 6265.
 *
 * @param zdt ZonedDateTime to format
 * @returns Cookie date string
 */
export function format(zdt: Temporal.ZonedDateTime): string {
  return imf_fixdate.format(zdt);
}

/**
 * Parse Cookie date string to TemporalInfo.
 * Implements RFC 6265 §5.1.1 lenient parsing algorithm.
 *
 * @param text Cookie date string
 * @param out Output TemporalInfo object to populate
 * @returns Populated TemporalInfo
 * @throws {RangeError} If parsing fails
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  // Tokenize the input per RFC 6265 §5.1.1
  const tokens = tokenizeCookie(text);

  if (tokens.length === 0) {
    throw new RangeError(`Empty cookie date: ${text}.`);
  }

  // Find date-time components among tokens
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  let hour: number | undefined;
  let minute: number | undefined;
  let second: number | undefined;

  for (const token of tokens) {
    // Try to parse as day-of-month (1-31)
    if (day === undefined) {
      const dayMatch = /^(\d{1,2})$/u.exec(token);
      if (dayMatch) {
        const dayValue = Number.parseInt(dayMatch[1], 10);
        if (dayValue >= 1 && dayValue <= 31) {
          day = dayValue;
          continue;
        }
      }
    }

    // Try to parse as month name
    if (month === undefined) {
      try {
        month = parseMonth(token);
        continue;
      } catch {
        // Not a month name
      }
    }

    // Try to parse as year
    if (year === undefined) {
      const yearMatch = /^(\d{2,4})$/u.exec(token);
      if (yearMatch) {
        try {
          year = parseCookieYear(yearMatch[1]);
          continue;
        } catch {
          // Invalid year (e.g., < 1601)
        }
      }
    }

    // Try to parse as time (HH:MM:SS or HH:MM)
    if (hour === undefined && minute === undefined && second === undefined) {
      const timeMatch = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/u.exec(token);
      if (timeMatch) {
        const hourValue = Number.parseInt(timeMatch[1], 10);
        const minuteValue = Number.parseInt(timeMatch[2], 10);
        const secondValue = timeMatch[3]
          ? Number.parseInt(timeMatch[3], 10)
          : 0;

        if (hourValue <= 23 && minuteValue <= 59 && secondValue <= 59) {
          hour = hourValue;
          minute = minuteValue;
          second = secondValue;
          continue;
        }
      }
    }
  }

  // Check that all required components were found
  if (
    day === undefined
    || month === undefined
    || year === undefined
    || hour === undefined
    || minute === undefined
    || second === undefined
  ) {
    throw new RangeError(`Incomplete cookie date: ${text}.`);
  }

  // Validate the complete date-time
  validateDateTime(year, month, day, hour, minute, second, {
    allowLeapSecond: false, // Cookies don't support leap seconds
  });

  // Populate output
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

  // Cookie dates are interpreted as GMT per RFC 6265
  out.offset = '+00:00';
  out.timeZone = 'UTC';

  return out;
}
