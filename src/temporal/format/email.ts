/**
 * Provide parsing and formatting for the Internet Email Date/Time Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @public
 * @module
 * @see [RFC822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc822)
 * @see [RFC1123(obsoletes)](https://datatracker.ietf.org/doc/html/rfc1123)
 * @see [RFC2822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2822)
 * @see [RFC5322](https://datatracker.ietf.org/doc/html/rfc5322)
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
    out.info = rfc5322.parse(input, out.info, true);
    return out;
  },
});
