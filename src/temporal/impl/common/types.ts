/**
 * Common types and structures for date-time parsing across different formats.
 *
 * @internal
 * @module
 */

/**
 * Intermediate parsing result containing normalized date-time components.
 */
export interface ParsedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number;
  /**
   * Source timezone information for tracking obsolete zones.
   * - 'numeric': Standard ±HHMM format
   * - 'obs-name': Obsolete named timezone (GMT, EST, military, etc.)
   */
  sourceTz: 'numeric' | 'obs-name';
}

/**
 * Options for parsing operations.
 */
export interface ParseOptions {
  /**
   * Allow leap seconds (:60).
   *
   * @default false
   */
  allowLeapSecond?: boolean;

  /**
   * Strict mode for parsing.
   *
   * @default false
   */
  strict?: boolean;
}

/**
 * Options for formatting operations.
 */
export interface FormatOptions {
  /**
   * Include day of week.
   *
   * @default true
   */
  includeDayOfWeek?: boolean;

  /**
   * Include seconds component.
   *
   * @default true
   */
  includeSeconds?: boolean;

  /**
   * Use colon in timezone offset.
   *
   * @default false
   */
  colonInOffset?: boolean;

  /**
   * Use 'Z' for UTC instead of +00:00.
   *
   * @default false
   */
  zForZero?: boolean;
}
