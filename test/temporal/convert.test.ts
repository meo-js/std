import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import {
  toDate,
  toDateTime,
  toDuration,
  toInstant,
  toTime,
  toZonedDateTime,
} from '../../src/temporal/convert.js';

describe('convert helpers', () => {
  it('Converts ISO-8601 Instant strings.', () => {
    const i1 = toInstant('2000-01-01T00:00:00Z');
    expect(i1.epochMilliseconds).toBe(946684800000);

    const i2 = toInstant('1994-11-06T08:49:37+00:00');
    expect(i2.toString()).toBe('1994-11-06T08:49:37Z');
  });

  it('Converts Duration strings and numbers.', () => {
    const d1 = toDuration('P1D');
    expect(d1.total('seconds')).toBe(86400);

    const d2 = toDuration(1500);
    expect(d2.milliseconds).toBe(1500);
  });

  it('Converts PlainTime/PlainDate/PlainDateTime from strings.', () => {
    expect(toTime('12:34:56').toString()).toBe('12:34:56');
    expect(toDate('2001-02-03').toString()).toBe('2001-02-03');
    expect(toDateTime('2001-02-03T04:05:06').toString()).toBe(
      '2001-02-03T04:05:06',
    );
  });

  it('Converts epoch to ZonedDateTime using provided time zone.', () => {
    const z1 = toZonedDateTime(946684800000, 'UTC');
    expect(z1.toString()).toBe('2000-01-01T00:00:00+00:00[UTC]');

    const z2 = toZonedDateTime(
      Temporal.Instant.from('2000-01-01T00:00:00Z'),
      'UTC',
    );
    expect(z2.toString()).toBe('2000-01-01T00:00:00+00:00[UTC]');
  });

  it('Parses RFC 9557 ZonedDateTime strings.', () => {
    const z = toZonedDateTime('2019-12-23T12:00:00-03:00[America/Sao_Paulo]');
    expect(z.offset).toMatch(/[-+]\d{2}:\d{2}/);
    expect(z.timeZoneId).toBe('America/Sao_Paulo');
  });
});
