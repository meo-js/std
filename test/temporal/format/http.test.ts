import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import * as http from '../../../src/temporal/format/http.js';

// Helpers for validation via Instant conversion.
function toDate(input: string): Date {
  const inst = http.toInstant(input);
  return new Date(inst.epochMilliseconds);
}

function expectUTCEqual(
  date: Date,
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  ss: number,
) {
  expect(date instanceof Date).toBe(true);
  expect(Number.isNaN(date.getTime())).toBe(false);
  const expected = Date.UTC(y, m - 1, d, hh, mm, ss);
  expect(date.getTime()).toBe(expected);
  const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.000Z`;
  expect(date.toISOString()).toBe(iso);
}

function expectInvalidParse(input: string) {
  let threw = false;
  try {
    const d = toDate(input);
    expect(Number.isNaN(d.getTime())).toBe(true);
  } catch {
    threw = true;
  }
  if (threw) expect(threw).toBe(true);
}

// =============================================================
// Tests for RFC 9110 (HTTP Semantics) §5.6.7: HTTP-date formats.
// =============================================================
describe('Tests for RFC 9110 spec.', () => {
  describe('format', () => {
    it('Generates IMF-fixdate exactly in GMT with single spaces.', () => {
      const z = Temporal.ZonedDateTime.from('1994-11-06T08:49:37+00:00[UTC]');
      const s = http.format(z);
      expect(s).toBe('Sun, 06 Nov 1994 08:49:37 GMT');
      expect(
        /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/u.test(
          s,
        ),
      ).toBe(true);
      expect(s.includes('  ')).toBe(false);
    });

    it('Accepts Instant/PlainDateTime/PlainDate/ZonedDateTime and normalizes to GMT.', () => {
      const inst = Temporal.Instant.from('2000-01-01T00:00:00Z');
      expect(http.format(inst)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');

      const pdt = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
      expect(http.format(pdt)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');

      const pd = Temporal.PlainDate.from('2000-01-01');
      expect(http.format(pd)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');

      const zdt = Temporal.ZonedDateTime.from(
        '2000-01-01T00:00:00+09:00[+09:00]',
      );
      expect(http.format(zdt)).toBe('Fri, 31 Dec 1999 15:00:00 GMT');
    });

    it('Rounds sub-second fractions to the nearest second before formatting.', () => {
      const base = Temporal.ZonedDateTime.from(
        '2000-01-01T00:00:00.600+00:00[UTC]',
      );
      expect(http.format(base)).toBe('Sat, 01 Jan 2000 00:00:01 GMT');
    });

    it('Rejects unsupported PlainTime input.', () => {
      // @ts-expect-error: plain time is not supported for formatting
      expect(() => http.format(Temporal.PlainTime.from('00:00:00'))).toThrow();
    });
  });

  describe('parse', () => {
    it('Accepts IMF-fixdate (preferred format).', () => {
      expect.hasAssertions();
      const d = toDate('Sun, 06 Nov 1994 08:49:37 GMT');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Accepts obs-date: RFC 850 date with two-digit year.', () => {
      expect.hasAssertions();
      const d = toDate('Sunday, 06-Nov-94 08:49:37 GMT');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Accepts obs-date: asctime date; assumes UTC.', () => {
      expect.hasAssertions();
      const s = 'Sun Nov  6 08:49:37 1994';
      const d = toDate(s);
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
      const z = http.toZonedDateTime(s);
      expect(z.offset).toBe('+00:00');
    });

    it('Accepts leap second value 60 and maps to the next UTC second.', () => {
      expect.hasAssertions();
      // Known positive leap seconds (UTC): 2012-06-30, 2016-12-31.
      const d1 = toDate('Sat, 30 Jun 2012 23:59:60 GMT');
      expectUTCEqual(d1, 2012, 7, 1, 0, 0, 0);
      const d2 = toDate('Sat, 31 Dec 2016 23:59:60 GMT');
      expectUTCEqual(d2, 2017, 1, 1, 0, 0, 0);
    });

    it('Ignores leading/trailing whitespace around the field value.', () => {
      expect.hasAssertions();
      const s = '  Sun, 06 Nov 1994 08:49:37 GMT  ';
      const d = toDate(s);
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Is case sensitive and requires literal GMT token.', () => {
      expect.hasAssertions();
      expectInvalidParse('sun, 06 Nov 1994 08:49:37 GMT'); // Day-name case.
      expectInvalidParse('Sun, 06 nov 1994 08:49:37 GMT'); // Month case.
      expectInvalidParse('Sun, 06 Nov 1994 08:49:37 gmt'); // GMT case.
      expectInvalidParse('Sun, 06 Nov 1994 08:49:37 UTC'); // Not allowed token.
    });

    it('Rejects invalid ranges and malformed inputs.', () => {
      expect.hasAssertions();
      expectInvalidParse('Sun, 31 Nov 1994 08:49:37 GMT'); // Invalid date.
      expectInvalidParse('Sun, 06 Nov 1994 24:00:00 GMT'); // Invalid hour.
      expectInvalidParse('Sun, 06 Nov 1994 23:60:00 GMT'); // Invalid minute.
      expectInvalidParse('Sun, 06 Nov 1994 23:59:61 GMT'); // Invalid second beyond leap.
      expectInvalidParse('Sun, 06 Nov 1994 08:49:37 GMT garbage'); // Trailing garbage.
    });
  });

  describe('toXxx conversions', () => {
    it('Converts parsed HTTP-date to Date/Time/PlainDateTime/Instant/ZonedDateTime in UTC.', () => {
      const s = 'Tue, 15 Nov 1994 08:12:31 GMT';
      const date = http.toDate(s);
      const time = http.toTime(s);
      const dt = http.toDateTime(s);
      const inst = http.toInstant(s);
      const zdt = http.toZonedDateTime(s);

      expect(date.toString()).toBe('1994-11-15');
      expect(time.toString()).toBe('08:12:31');
      expect(dt.toString()).toBe('1994-11-15T08:12:31');
      expect(inst.toString()).toBe('1994-11-15T08:12:31Z');
      expect(zdt.offset).toBe('+00:00');
    });
  });
});

// ===========================================
// Tests for RFC 7231 (obsoleted by RFC 9110).
// ===========================================
describe('Tests for RFC 7231 spec.', () => {
  describe('parse', () => {
    it('Recipient MUST accept all three formats.', () => {
      expect.hasAssertions();
      expectUTCEqual(
        toDate('Sun, 06 Nov 1994 08:49:37 GMT'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
      expectUTCEqual(
        toDate('Sunday, 06-Nov-94 08:49:37 GMT'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
      expectUTCEqual(
        toDate('Sun Nov  6 08:49:37 1994'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
    });

    it('HTTP-date is case sensitive.', () => {
      expect.hasAssertions();
      expectInvalidParse('Sun, 06 Nov 1994 08:49:37 gmt');
      expectInvalidParse('sun, 06 Nov 1994 08:49:37 GMT');
    });
  });

  describe('format', () => {
    it('Sender MUST generate IMF-fixdate only.', () => {
      const z = Temporal.ZonedDateTime.from(
        '2016-11-01T13:23:12+01:00[+01:00]',
      );
      const s = http.format(z);
      expect(s).toBe('Tue, 01 Nov 2016 12:23:12 GMT');
    });
  });
});

// ===========================================
// Tests for RFC 2616 (HTTP/1.1, obsolete).
// ===========================================
describe('Tests for RFC 2616 spec.', () => {
  describe('parse', () => {
    it('All HTTP-date stamps MUST be in GMT (asctime assumed UTC).', () => {
      expect.hasAssertions();
      const d1 = toDate('Friday, 19-Nov-82 16:14:55 GMT');
      expectUTCEqual(d1, 1982, 11, 19, 16, 14, 55);
      const d2 = toDate('Fri Nov 19 16:14:55 1982');
      expectUTCEqual(d2, 1982, 11, 19, 16, 14, 55);
    });

    it('Rejects additional whitespace beyond SP in IMF-fixdate.', () => {
      expect.hasAssertions();
      expectInvalidParse('Sun, 06  Nov 1994 08:49:37 GMT');
      expectInvalidParse('Sun, 06 Nov 1994 08:49:37  GMT');
    });
  });
});

// ===========================================
// Tests for RFC 1945 (HTTP/1.0, informational).
// ===========================================
describe('Tests for RFC 1945 spec.', () => {
  describe('parse', () => {
    it('Should accept RFC 1123/RFC 850/asctime formats.', () => {
      expect.hasAssertions();
      expectUTCEqual(
        toDate('Sun, 06 Nov 1994 08:49:37 GMT'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
      expectUTCEqual(
        toDate('Sunday, 06-Nov-94 08:49:37 GMT'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
      expectUTCEqual(
        toDate('Sun Nov  6 08:49:37 1994'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
    });

    it('Rejects lowercase weekday/month names in RFC 850 (case sensitive).', () => {
      expect.hasAssertions();
      expectInvalidParse('sunday, 06-Nov-94 08:49:37 GMT');
      expectInvalidParse('Sunday, 06-nov-94 08:49:37 GMT');
    });
  });
});
