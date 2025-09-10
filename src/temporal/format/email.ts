/**
 * Provide parsing and formatting for the Internet Email Date/Time Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @module
 * @see [RFC822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc822)
 * @see [RFC1123(obsoletes)](https://datatracker.ietf.org/doc/html/rfc1123)
 * @see [RFC2822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2822)
 * @see [RFC5322](https://datatracker.ietf.org/doc/html/rfc5322)
 */
import type { Temporal } from 'temporal-polyfill';
import {
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isZonedDateTime,
} from '../../predicate.js';
import { getStringTag } from '../../primitive.js';
import * as convert from '../convert.js';
import {
  type BaseFormatter,
  createFormatter,
  type DateFormatter,
  type DateTimeFormatter,
  type InstantFormatter,
  type TimeFormatter,
  type ZonedDateTimeFormatter,
} from '../formatter.js';
import * as rfc5322 from '../impl/rfc5322.js';

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
  format(input, args) {
    // RFC 5322 requires a numeric offset and no calendar/timezone IDs
    // We accept ZonedDateTime and Instant; Plain* are not sufficient to format unambiguously.
    let zdt: Temporal.ZonedDateTime;

    if (isZonedDateTime(input)) {
      // Use its offset at that instant; RFC 5322 prints numeric offset without colon
      zdt = input;
    } else if (isInstant(input)) {
      // Represent in UTC for deterministic output
      zdt = input.toZonedDateTimeISO('UTC');
    } else if (isPlainDateTime(input)) {
      // Assume UTC to avoid guessing; users should provide ZDT/Instant for precise offset
      zdt = convert.toZonedDateTime(input, 'UTC');
    } else if (isPlainDate(input)) {
      // Promote with midnight UTC
      zdt = convert.toZonedDateTime(
        input.toPlainDateTime({ hour: 0, minute: 0, second: 0 }),
        'UTC',
      );
    } else {
      throw new Error(`Unsupported temporal type: ${getStringTag(input)}.`);
    }

    // Round to nearest second as RFC 5322 has no fractional seconds.
    const ns = zdt.nanosecond + zdt.microsecond * 1e3 + zdt.millisecond * 1e6;
    if (ns !== 0) {
      const plus = ns >= 500_000_000 ? 1 : 0; // round half up to next second
      zdt = zdt
        .add({ seconds: plus })
        .with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
    }

    return rfc5322.format(zdt);
  },
  parse(input, args, out) {
    out.info = rfc5322.parse(input, out.info);
    // Prefer constructing ZonedDateTime with fixed offset time zone
    // Nothing else to set in opts; conversion functions will use info.offset/timeZone
    return out;
  },
});
