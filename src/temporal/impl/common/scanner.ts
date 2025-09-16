/**
 * Unified lexical scanner for date-time parsing.
 * Handles whitespace, separators, CFWS (Comment Folding White Space), and token splitting.
 *
 * @internal
 * @module
 */

/**
 * Remove RFC 5322 comments (CFWS) from string.
 * Handles nested parentheses properly.
 *
 * @param text Input text with potential comments
 * @returns Text with comments removed
 */
export function stripComments(text: string): string {
  let result = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth > 0) {
        depth--;
      } else {
        // Unmatched closing paren, keep it
        result += char;
      }
    } else if (depth === 0) {
      result += char;
    }
    // Characters inside comments (depth > 0) are discarded
  }

  return result;
}

/**
 * Normalize whitespace in RFC 5322 format.
 * - Unfolds CRLF + WSP sequences to single space
 * - Collapses multiple whitespace to single space
 * - Trims leading/trailing whitespace
 *
 * @param text Input text
 * @returns Normalized text
 */
export function normalizeWhitespace(text: string): string {
  return (
    text
      // Unfold CRLF + WSP (tab or space)
      .replace(/\r\n[\t ]+/gu, ' ')
      // Collapse multiple whitespace
      .replace(/[\t ]+/gu, ' ')
      .trim()
  );
}

/**
 * Full RFC 5322 text normalization (comments + whitespace).
 *
 * @param text Input text
 * @returns Normalized text
 */
export function normalizeRfc5322(text: string): string {
  return normalizeWhitespace(stripComments(text));
}

/**
 * Split text into tokens for Cookie parsing per RFC 6265 §5.1.1.
 * Uses delimiter/non-delimiter classification.
 *
 * @param text Input cookie date string
 * @returns Array of non-delimiter tokens
 */
export function tokenizeCookie(text: string): string[] {
  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (isCookieDelimiter(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Check if character is a delimiter per RFC 6265 cookie parsing.
 * Delimiters: \t, \x20-\x2F, \x3B-\x40, \x5B-\x60, \x7B-\x7E
 *
 * @param char Character to check
 * @returns True if character is a delimiter
 */
function isCookieDelimiter(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    code === 0x09 // \t
    || (code >= 0x20 && code <= 0x2f) // \x20-\x2F
    || (code >= 0x3b && code <= 0x40) // \x3B-\x40
    || (code >= 0x5b && code <= 0x60) // \x5B-\x60
    || (code >= 0x7b && code <= 0x7e) // \x7B-\x7E
  );
}

/**
 * Split text by whitespace and common separators.
 * Used for general date-time parsing.
 *
 * @param text Input text
 * @returns Array of tokens
 */
export function tokenizeGeneral(text: string): string[] {
  return text.split(/[\s,]+/u).filter(token => token.length > 0);
}

/**
 * Handle asctime format special case for single-digit days.
 * "Mon Jan _2 15:04:05 2006" (note the leading space for single digit)
 *
 * @param text Potential asctime string
 * @returns Normalized text with single spaces
 */
export function normalizeAsctime(text: string): string {
  // Replace multiple spaces with single space, but preserve the structure
  return text.replace(/\s+/gu, ' ').trim();
}

/**
 * Parse numeric offset in various formats.
 * Supports: +HHMM, -HHMM, +HH:MM, -HH:MM, +HH, -HH
 *
 * @param offset Offset string
 * @returns Offset in minutes
 * @throws {RangeError} If offset format is invalid
 */
export function parseNumericOffset(offset: string): number {
  const match = /^([+-])(\d{1,2})(?::?(\d{2}))?$/u.exec(offset);
  if (!match) {
    throw new RangeError(`Invalid numeric offset: ${offset}.`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;

  if (hours > 23 || minutes > 59) {
    throw new RangeError(`Invalid offset values: ${offset}.`);
  }

  return sign * (hours * 60 + minutes);
}

/**
 * Format offset minutes to string.
 *
 * @param minutes Offset in minutes
 * @param useColon Whether to include colon separator
 * @param useZ Whether to use 'Z' for zero offset
 * @returns Formatted offset string
 */
export function formatOffset(
  minutes: number,
  useColon: boolean,
  useZ: boolean,
): string {
  if (minutes === 0 && useZ) {
    return 'Z';
  }

  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = Math.trunc(abs / 60);
  const mins = abs % 60;

  const hourStr = String(hours).padStart(2, '0');
  const minStr = String(mins).padStart(2, '0');

  return useColon
    ? `${sign}${hourStr}:${minStr}`
    : `${sign}${hourStr}${minStr}`;
}
