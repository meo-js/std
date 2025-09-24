/**
 * @internal
 * @module
 */
import type { Temporal } from 'temporal-polyfill';

export function roundToSecond(
  zdt: Temporal.ZonedDateTime,
): Temporal.ZonedDateTime {
  const ns = zdt.nanosecond + zdt.microsecond * 1e3 + zdt.millisecond * 1e6;
  if (ns === 0) return zdt;

  const carry = ns >= 500_000_000 ? 1 : 0;
  return zdt
    .add({ seconds: carry })
    .with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
}
