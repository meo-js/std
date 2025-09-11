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
    let zdt: Temporal.ZonedDateTime;

    if (isZonedDateTime(input)) {
      zdt = input;
    } else if (isInstant(input)) {
      zdt = input.toZonedDateTimeISO('UTC');
    } else if (isPlainDateTime(input)) {
      zdt = convert.toZonedDateTime(input, 'UTC');
    } else if (isPlainDate(input)) {
      zdt = convert.toZonedDateTime(
        input.toPlainDateTime({ hour: 0, minute: 0, second: 0 }),
        'UTC',
      );
    } else {
      throw new Error(`Unsupported temporal type: ${getStringTag(input)}.`);
    }

    zdt = roundToSecond(zdt);

    return rfc5322.format(zdt);
  },
  parse(input, args, out) {
    out.info = rfc5322.parse(input, out.info);
    return out;
  },
});

function roundToSecond(zdt: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
  const ns = zdt.nanosecond + zdt.microsecond * 1e3 + zdt.millisecond * 1e6;
  if (ns === 0) return zdt;

  // Round to the nearest second.
  const carry = ns >= 500_000_000 ? 1 : 0;
  return zdt
    .add({ seconds: carry })
    .with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
}
