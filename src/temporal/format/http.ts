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
import * as http from '../impl/http.js';

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

    return http.format(zdt);
  },
  parse(input, _args, out) {
    out.info = http.parse(input, out.info);
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
