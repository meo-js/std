/**
 * Date validation and calendar utilities.
 * Handles date validity, leap seconds, and weekday consistency checks.
 *
 * @internal
 * @module
 */

/**
 * Days in each month for non-leap years.
 */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Check if a year is a leap year.
 *
 * @param year Full year number
 * @returns True if year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get number of days in a given month and year.
 *
 * @param year Full year number
 * @param month 1-based month number (1-12)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}.`);
  }

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return DAYS_IN_MONTH[month - 1];
}

/**
 * Validate basic date components.
 *
 * @param year Full year number
 * @param month 1-based month number (1-12)
 * @param day 1-based day number
 * @throws {RangeError} If date is invalid
 */
export function validateDate(year: number, month: number, day: number): void {
  if (month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}.`);
  }

  const daysInMonth = getDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) {
    throw new RangeError(`Invalid day: ${day} for ${year}-${month}.`);
  }
}

/**
 * Validate time components with optional leap second support.
 *
 * @param hour Hour (0-23)
 * @param minute Minute (0-59)
 * @param second Second (0-59, or 0-60 if leap seconds allowed)
 * @param allowLeapSecond Whether to allow second=60
 * @throws {RangeError} If time is invalid
 */
export function validateTime(
  hour: number,
  minute: number,
  second: number,
  allowLeapSecond = false,
): void {
  if (hour < 0 || hour > 23) {
    throw new RangeError(`Invalid hour: ${hour}.`);
  }

  if (minute < 0 || minute > 59) {
    throw new RangeError(`Invalid minute: ${minute}.`);
  }

  const maxSecond = allowLeapSecond ? 60 : 59;
  if (second < 0 || second > maxSecond) {
    throw new RangeError(`Invalid second: ${second}.`);
  }
}

/**
 * Calculate day of week for a given date using Zeller's congruence.
 * Returns 0=Sunday, 1=Monday, ..., 6=Saturday
 *
 * @param year Full year number
 * @param month 1-based month number (1-12)
 * @param day 1-based day number
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function calculateDayOfWeek(
  year: number,
  month: number,
  day: number,
): number {
  // Zeller's congruence algorithm
  // Adjust for algorithm: January and February are treated as months 13 and 14 of the previous year
  if (month < 3) {
    month += 12;
    year -= 1;
  }

  const k = year % 100;
  const j = Math.floor(year / 100);

  const h =
    (day
      + Math.floor((13 * (month + 1)) / 5)
      + k
      + Math.floor(k / 4)
      + Math.floor(j / 4)
      - 2 * j)
    % 7;

  // Convert from Zeller's result (0=Saturday) to our format (0=Sunday)
  return (h + 6) % 7;
}

/**
 * Validate that given weekday matches the calculated day of week.
 * Used for consistency checking in email and netnews formats.
 *
 * @param year Full year number
 * @param month 1-based month number (1-12)
 * @param day 1-based day number
 * @param expectedWeekday Expected weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param strict Whether to throw error on mismatch (vs warning)
 * @throws {RangeError} If strict=true and weekday doesn't match
 */
export function validateWeekday(
  year: number,
  month: number,
  day: number,
  expectedWeekday: number,
  strict = false,
): void {
  const actualWeekday = calculateDayOfWeek(year, month, day);

  if (actualWeekday !== expectedWeekday) {
    const message = `Weekday mismatch: expected ${expectedWeekday}, calculated ${actualWeekday} for ${year}-${month}-${day}.`;

    if (strict) {
      throw new RangeError(message);
    }
    // In non-strict mode, we could log a warning, but for now just ignore
    // console.warn(message);
  }
}

/**
 * Complete date-time validation for parsing.
 *
 * @param year Full year number
 * @param month 1-based month number (1-12)
 * @param day 1-based day number
 * @param hour Hour (0-23)
 * @param minute Minute (0-59)
 * @param second Second (0-59 or 0-60)
 * @param options Validation options
 * @throws {RangeError} If any component is invalid
 */
export function validateDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  options: {
    allowLeapSecond?: boolean;
    weekday?: number;
    strictWeekday?: boolean;
  } = {},
): void {
  validateDate(year, month, day);
  validateTime(hour, minute, second, options.allowLeapSecond);

  if (options.weekday !== undefined) {
    validateWeekday(year, month, day, options.weekday, options.strictWeekday);
  }
}

/**
 * Check if a date-time represents a leap second.
 *
 * @param hour Hour
 * @param minute Minute
 * @param second Second
 * @returns True if this is a leap second (:60)
 */
export function isLeapSecond(
  _hour: number,
  _minute: number,
  second: number,
): boolean {
  return second === 60;
}

/**
 * Normalize leap second to the next minute.
 * Converts 23:59:60 to 00:00:00 of next day.
 *
 * @param year Year
 * @param month Month
 * @param day Day
 * @param hour Hour
 * @param minute Minute
 * @param second Second
 * @returns Normalized date-time components
 */
export function normalizeLeapSecond(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  if (second !== 60) {
    return { year, month, day, hour, minute, second };
  }

  // Convert leap second to next minute
  const newSecond = 0;
  let newMinute = minute + 1;
  let newHour = hour;
  let newDay = day;
  let newMonth = month;
  let newYear = year;

  if (newMinute === 60) {
    newMinute = 0;
    newHour += 1;

    if (newHour === 24) {
      newHour = 0;
      newDay += 1;

      const daysInMonth = getDaysInMonth(newYear, newMonth);
      if (newDay > daysInMonth) {
        newDay = 1;
        newMonth += 1;

        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }
    }
  }

  return {
    year: newYear,
    month: newMonth,
    day: newDay,
    hour: newHour,
    minute: newMinute,
    second: newSecond,
  };
}
