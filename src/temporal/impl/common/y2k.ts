/**
 * Two-digit year conversion strategies for different RFC standards.
 * Each format has specific rules for interpreting 2-digit years.
 *
 * @internal
 * @module
 */

/**
 * Parse year string with 2-digit year handling per RFC 2822/5322.
 * - 2-digit years: 00-49 → 2000-2049, 50-99 → 1950-1999
 * - 3-digit years: Extremely obsolete, assume 1900 + year
 * - 4+ digit years: Use as-is
 *
 * @param yearStr Year string from email date
 * @returns Full 4-digit year
 * @throws {RangeError} If year is invalid
 */
export function parseEmailYear(yearStr: string): number {
  const year = Number.parseInt(yearStr, 10);

  if (!Number.isFinite(year)) {
    throw new RangeError(`Invalid year: ${yearStr}.`);
  }

  if (yearStr.length === 2) {
    // RFC 2822 §4.3: 2-digit year handling
    return year < 50 ? 2000 + year : 1900 + year;
  } else if (yearStr.length === 3) {
    // Extremely obsolete 3-digit years
    return 1900 + year;
  } else {
    // 4+ digit years or single digit (very rare)
    return year;
  }
}

/**
 * Parse year string per HTTP RFC 850 format.
 * RFC 850 uses 2-digit years with different interpretation than email.
 * Follows same rule as email for consistency.
 *
 * @param yearStr Year string from HTTP RFC 850 date
 * @returns Full 4-digit year
 * @throws {RangeError} If year is invalid
 */
export function parseHttpRfc850Year(yearStr: string): number {
  const year = Number.parseInt(yearStr, 10);

  if (!Number.isFinite(year) || yearStr.length !== 2) {
    throw new RangeError(`Invalid RFC 850 year: ${yearStr}.`);
  }

  // Same as email: 00-49 → 2000-2049, 50-99 → 1950-1999
  return year < 50 ? 2000 + year : 1900 + year;
}

/**
 * Parse year string per Cookie RFC 6265 format.
 * RFC 6265 §5.1.1 has specific 2-digit year rules:
 * - 00-69 → 2000-2069
 * - 70-99 → 1970-1999
 * - Year must be >= 1601
 *
 * @param yearStr Year string from cookie date
 * @returns Full 4-digit year
 * @throws {RangeError} If year is invalid or < 1601
 */
export function parseCookieYear(yearStr: string): number {
  const year = Number.parseInt(yearStr, 10);

  if (!Number.isFinite(year)) {
    throw new RangeError(`Invalid year: ${yearStr}.`);
  }

  let fullYear: number;

  if (yearStr.length === 2) {
    // RFC 6265 2-digit year rules (different from email!)
    fullYear = year <= 69 ? 2000 + year : 1900 + year;
  } else {
    fullYear = year;
  }

  // RFC 6265 requires year >= 1601
  if (fullYear < 1601) {
    throw new RangeError(`Cookie year must be >= 1601, got: ${fullYear}.`);
  }

  return fullYear;
}

/**
 * Parse year string per Netnews format.
 * Netnews follows RFC 5322 (same as email) since RFC 5536.
 *
 * @param yearStr Year string from netnews date
 * @returns Full 4-digit year
 * @throws {RangeError} If year is invalid
 */
export function parseNetnewsYear(yearStr: string): number {
  return parseEmailYear(yearStr);
}

/**
 * Validate that year is in reasonable range for formatting.
 * Most formats expect 4-digit years (0000-9999).
 *
 * @param year Full year number
 * @throws {RangeError} If year is out of range
 */
export function validateFormattingYear(year: number): void {
  if (year < 0 || year > 9999) {
    throw new RangeError(
      `Year must be 0000-9999 for formatting, got: ${year}.`,
    );
  }
}

/**
 * Format year as 4-digit string with leading zeros.
 *
 * @param year Year number
 * @returns 4-digit year string
 */
export function formatYear(year: number): string {
  validateFormattingYear(year);
  return String(year).padStart(4, '0');
}

/**
 * Format year as 2-digit string for obsolete formats.
 * Only use this for generating obsolete format compatibility.
 *
 * @param year Year number
 * @returns 2-digit year string
 */
export function formatYearTwoDigit(year: number): string {
  if (year < 1900 || year > 2099) {
    throw new RangeError(
      `Cannot format year ${year} as 2-digit (range 1900-2099).`,
    );
  }
  return String(year % 100).padStart(2, '0');
}
