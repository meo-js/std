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
import * as netnews from '../impl/netnews.js';

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

    return netnews.format(zdt);
  },
  parse(input, _args, out) {
    out.info = netnews.parse(input, out.info);
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
