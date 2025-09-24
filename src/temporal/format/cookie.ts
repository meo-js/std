/**
 * Provide parsing and formatting for HTTP Cookies Date Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @public
 * @module
 * @see Original Netscape Cookie Specification (no RFC, described in RFC 2109 Appendix)
 * @see [RFC2109(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2109)
 * @see [RFC2965(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2965)
 * @see [RFC6265(references: RFC1123)](https://datatracker.ietf.org/doc/html/rfc6265)
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
import * as rfc6265 from '../impl/rfc6265.js';

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
    return rfc6265.format(toZonedDateTimeWithDefaults(input, 'UTC'));
  },
  parse(input, _args, out) {
    out.info = rfc6265.parse(input, out.info);
    return out;
  },
});
