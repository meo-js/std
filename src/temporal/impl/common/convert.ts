/**
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import {
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isZonedDateTime,
} from '../../../predicate.js';
import { getStringTag } from '../../../primitive.js';
import * as convert from '../../convert.js';
import type { TemporalObject } from '../../shared.js';

export function toZonedDateTimeWithDefaults(
  input: TemporalObject,
  defaultTimeZone: string,
) {
  if (isZonedDateTime(input)) {
    return input;
  } else if (isInstant(input) || isPlainDate(input) || isPlainDateTime(input)) {
    return convert.toZonedDateTime(input as Temporal.Instant, defaultTimeZone);
  } else {
    throw new Error(`Unsupported temporal type: ${getStringTag(input)}.`);
  }
}
