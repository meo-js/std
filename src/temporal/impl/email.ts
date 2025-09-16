/**
 * Email date-time parsing and formatting implementation.
 * Supports RFC 822/1123/2822/5322 specifications.
 *
 * Parsing: Full backward compatibility with obsolete forms
 * Formatting: Modern RFC 5322 format with numeric timezone
 *
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';
import { formatRfc5322, parseRfc5322 } from './common/rfc5322.js';
import { formatOffset } from './common/scanner.js';

/**
 * Format ZonedDateTime as Email date string.
 * Uses modern RFC 5322 format with numeric timezone.
 * Always includes day-of-week and seconds components.
 *
 * @param zdt ZonedDateTime to format
 * @returns Email date string (RFC 5322 format)
 */
export function format(zdt: Temporal.ZonedDateTime): string {
  return formatRfc5322(zdt, {
    includeDayOfWeek: true,
    includeSeconds: true,
    colonInOffset: false,
  });
}

/**
 * Parse Email date string to TemporalInfo.
 * Accepts all RFC 822/1123/2822/5322 variations including:
 * - Obsolete timezone names (GMT, US zones, military letters)
 * - 2-digit years with proper Y2K handling
 * - Comments (CFWS) and folding whitespace
 * - Optional seconds component
 * - Leap seconds (:60)
 *
 * @param text Email date string
 * @param out Output TemporalInfo object to populate
 * @returns Populated TemporalInfo
 * @throws {RangeError} If parsing fails
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  const result = parseRfc5322(text, true); // Allow leap seconds
  return populateTemporalInfo(out, result);
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
