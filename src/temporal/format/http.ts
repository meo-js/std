/**
 * Provide parsing and formatting for HTTP Date Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @public
 * @module
 * @see [RFC1945(obsoletes, references: RFC822, RFC1123, RFC850, RFC1036, asctime)](https://datatracker.ietf.org/doc/html/rfc1945)
 * @see [RFC2616(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2616)
 * @see [RFC7231(obsoletes, references: RFC5322)](https://datatracker.ietf.org/doc/html/rfc7231)
 * @see [RFC9110](https://datatracker.ietf.org/doc/html/rfc9110)
 */
import {
  type BaseFormatter,
  createFormatter,
  type DateFormatter,
  type DateTimeFormatter,
  type InstantFormatter,
  type TimeFormatter,
  type ZonedDateTimeFormatter,
} from '../formatter.js';
import * as asctime from '../impl/asctime.js';
import { toZonedDateTimeWithDefaults } from '../impl/common/convert.js';
import * as imf_fixdate from '../impl/imf_fixdate.js';
import * as rfc850 from '../impl/rfc850.js';

export const {
  format,
  parse,
  toDate,
  toDateTime,
  toInstant,
  toTime,
  toZonedDateTime,
} = createFormatter<
  BaseFormatter
    & InstantFormatter
    & ZonedDateTimeFormatter
    & DateTimeFormatter
    & DateFormatter
    & TimeFormatter.Parse
>({
  format(input, _args) {
    return imf_fixdate.format(toZonedDateTimeWithDefaults(input, 'UTC'));
  },
  parse(input, _args, out) {
    const trimmed = input.trim();

    // Try IMF-fixdate first (most common)
    try {
      out.info = imf_fixdate.parse(trimmed, out.info);
      return out;
    } catch {
      // Continue to next format
    }

    // Try RFC 850 format
    try {
      // Populate out directly via unified RFC 850 parser with explicit options.
      out.info = rfc850.parse(trimmed, out.info, {
        requireGMT: true,
        enforceTwoDigitDay: true,
        caseSensitiveTokens: true,
        allowLeapSecond: false,
        useHttpTwoDigitYear: true,
      });
      return out;
    } catch {
      // Continue to next format
    }

    // Try asctime format
    try {
      out.info = asctime.parse(trimmed, out.info);
      return out;
    } catch {
      // All formats failed
    }

    throw new RangeError(`Invalid HTTP-date format: ${input}.`);
  },
});
