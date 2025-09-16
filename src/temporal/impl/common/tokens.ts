/**
 * Token constants and case-insensitive matchers for date-time parsing.
 *
 * @internal
 * @module
 */

/**
 * Month names in English (3-letter abbreviations).
 */
export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Month names in lowercase for parsing.
 */
export const MONTHS_LOWER = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/**
 * Case-insensitive month name to 1-based month number mapping.
 */
export const MONTH_INDEX: Record<string, number | undefined> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * Weekday names (3-letter abbreviations).
 * Order: Sunday=0, Monday=1, ..., Saturday=6
 */
export const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/**
 * Full weekday names for RFC 850 format.
 * Order: Sunday=0, Monday=1, ..., Saturday=6
 */
export const WEEKDAYS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Case-insensitive weekday name to index mapping.
 */
export const WEEKDAY_INDEX: Record<string, number | undefined> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Parse month name (case-insensitive) to 1-based month number.
 *
 * @param month Month name (e.g., "Jan", "january", "JAN")
 * @returns 1-based month number (1-12)
 * @throws {RangeError} If month name is invalid
 */
export function parseMonth(month: string): number {
  const normalized = month.toLowerCase();
  const monthNum = MONTH_INDEX[normalized];
  if (monthNum === undefined) {
    throw new RangeError(`Invalid month: ${month}.`);
  }
  return monthNum;
}

/**
 * Parse weekday name (case-insensitive) to index.
 *
 * @param weekday Weekday name (e.g., "Sun", "monday", "WED")
 * @returns Weekday index (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @throws {RangeError} If weekday name is invalid
 */
export function parseWeekday(weekday: string): number {
  const normalized = weekday.toLowerCase();
  const dayIndex = WEEKDAY_INDEX[normalized];
  if (dayIndex === undefined) {
    throw new RangeError(`Invalid weekday: ${weekday}.`);
  }
  return dayIndex;
}

/**
 * Format month number to 3-letter name.
 *
 * @param month 1-based month number (1-12)
 * @returns Month name (e.g., "Jan")
 * @throws {RangeError} If month is out of range
 */
export function formatMonth(month: number): string {
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}.`);
  }
  return MONTHS[month - 1];
}

/**
 * Format weekday index to 3-letter name.
 *
 * @param weekday Weekday index (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Weekday name (e.g., "Sun")
 * @throws {RangeError} If weekday is out of range
 */
export function formatWeekday(weekday: number): string {
  if (weekday < 0 || weekday > 6) {
    throw new RangeError(`Invalid weekday: ${weekday}.`);
  }
  return WEEKDAYS[weekday];
}

/**
 * Format weekday index to full name for RFC 850.
 *
 * @param weekday Weekday index (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Full weekday name (e.g., "Sunday")
 * @throws {RangeError} If weekday is out of range
 */
export function formatWeekdayFull(weekday: number): string {
  if (weekday < 0 || weekday > 6) {
    throw new RangeError(`Invalid weekday: ${weekday}.`);
  }
  return WEEKDAYS_FULL[weekday];
}
