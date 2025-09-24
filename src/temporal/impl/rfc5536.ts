import type { TemporalInfo } from '../shared.js';
import { formatOffset } from './common/scanner.js';
import { parseMonth, parseWeekday } from './common/tokens.js';
import { parseTimezone } from './common/tzmap.js';
import { validateDateTime } from './common/validate.js';
import { parseNetnewsYear } from './common/y2k.js';

/**
 * Parse date with unknown timezone as +0000 per RFC 5536.
 *
 * @param text Date string with potentially unknown timezone
 * @returns Parsed date-time components
 */
export function parseWithUnknownTimezone(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
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
