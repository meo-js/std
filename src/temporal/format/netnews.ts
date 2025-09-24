/**
 * Provide parsing and formatting for the Usenet/Netnews Date Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @public
 * @module
 * @see [RFC850(obsoletes)](https://datatracker.ietf.org/doc/html/rfc850)
 * @see [RFC1036(obsoletes)](https://datatracker.ietf.org/doc/html/rfc1036)
 * @see [RFC5536(references: RFC5322)](https://datatracker.ietf.org/doc/html/rfc5536)
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
import { toZonedDateTimeWithDefaults } from '../impl/common/convert.js';
import * as rfc5322 from '../impl/rfc5322.js';
import * as rfc5536 from '../impl/rfc5536.js';
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
    return rfc5322.format(toZonedDateTimeWithDefaults(input, 'UTC'), {
      includeDayOfWeek: true,
      includeSeconds: true,
      colonInOffset: false,
    });
  },
  parse(input, _args, out) {
    try {
      // Try standard RFC 5322 parsing first
      out.info = rfc5322.parse(input, out.info, true);
      return out;
    } catch {
      // Continue to next format
    }

    const trimmed = input.trim();

    // Try RFC 850 format: "Friday, 19-Nov-82 16:14:55 EST"
    try {
      out.info = rfc850.parse(trimmed, out.info);
      return out;
    } catch {
      // Continue to next format
    }

    // Special case: handle unknown timezones as +0000 (per RFC 5536)
    try {
      out.info = rfc5536.parseWithUnknownTimezone(trimmed, out.info);
      return out;
    } catch {
      // Continue to final error
    }

    // Special case: replace GMT with +0000 and try again
    const gmtPattern = /\bGMT\b/gu;
    if (gmtPattern.test(input)) {
      const modifiedText = input.replace(gmtPattern, '+0000');
      try {
        out.info = rfc5322.parse(modifiedText, out.info, true);
        return out;
      } catch {
        // Still failed, fall through to error
      }
    }

    throw new RangeError(`Invalid Netnews date format: ${input}.`);
  },
});
