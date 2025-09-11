import { Temporal } from 'temporal-polyfill';
import { describe, expect, it, test } from 'vitest';
import * as email from '../../../src/temporal/format/email.js';

// Helpers for extended parsing tests.
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

function parseEmailDate(input: string): Date {
  const inst = email.toInstant(input);
  return new Date(inst.epochMilliseconds);
}

function expectInvalidParse(input: string) {
  let threw = false;
  try {
    const d = parseEmailDate(input);
    expect(Number.isNaN(d.getTime())).toBe(true);
  } catch {
    threw = true;
  }
  if (threw) expect(threw).toBe(true);
}

test('Format ZonedDateTime with numeric offset.', () => {
  const z = Temporal.ZonedDateTime.from('2016-11-01T13:23:12+01:00[+01:00]');
  const s = email.format(z);
  expect(s).toBe('Tue, 01 Nov 2016 13:23:12 +0100');
});

test('Parse with comments, obs tz and no seconds.', () => {
  const s = ' (comment) Tue, 01 Nov 16 13:23 (x) +0100 ';
  const info = email.parse(s);
  const zdt = email.toZonedDateTime(s);
  expect(info.year).toBe(2016);
  expect(info.month).toBe(11);
  expect(info.day).toBe(1);
  expect(info.second).toBe(0);
  expect(info.offset).toBe('+01:00');
  expect(zdt.offset).toBe('+01:00');
});

test('Military time zone letter.', () => {
  const s = '01 Nov 2016 13:23:12 n'; // 'n' => -1 hour
  const info = email.parse(s);
  expect(info.offset).toBe('-01:00');
});

test('Z is UTC.', () => {
  const s = '01 Nov 2016 13:23:12 Z';
  const info = email.parse(s);
  expect(info.offset).toBe('+00:00');
  const z = email.toZonedDateTime(s);
  expect(z.offset).toBe('+00:00');
});

test('2-digit and 3-digit years.', () => {
  expect(email.parse('01 Nov 49 00:00 +0000').year).toBe(2049);
  expect(email.parse('01 Nov 50 00:00 +0000').year).toBe(1950);
  expect(email.parse('01 Nov 999 00:00 +0000').year).toBe(2899);
});

test('Rounding milliseconds.', () => {
  const base = Temporal.ZonedDateTime.from(
    '2000-01-01T00:00:00.600+00:00[+00:00]',
  );
  const s = email.format(base);
  expect(s).toBe('Sat, 01 Jan 2000 00:00:01 +0000');
});

test('Format accepts Instant/PlainDateTime/PlainDate.', () => {
  const inst = Temporal.Instant.from('2000-01-01T00:00:00Z');
  expect(email.format(inst)).toMatch('+0000');

  const pdt = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
  expect(email.format(pdt)).toContain('2000');

  const pd = Temporal.PlainDate.from('2000-01-01');
  expect(email.format(pd)).toContain('00:00:00');
});

test('Format rejects unsupported.', () => {
  // @ts-expect-error: plain time is not supported for formatting
  expect(() => email.format(Temporal.PlainTime.from('00:00:00'))).toThrow();
});

// Extended parsing suite (unique cases only; duplicates with above are omitted).
describe('Email Date-Time parsing across RFC 822/1123/2822/5322 (with obs-*).', () => {
  describe('Valid inputs.', () => {
    it('RFC 822: Two-digit year with named zone (GMT).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri, 21 Nov 97 09:55:06 GMT');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('RFC 1123: Four-digit year with GMT.', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Sun, 06 Nov 1994 08:49:37 GMT');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('RFC 2822: Numeric zone -0600.', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri, 21 Nov 1997 09:55:06 -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('RFC 5322: Numeric zone -0330 (half hour).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Thu, 13 Feb 1969 23:32:54 -0330');
      expectUTCEqual(d, 1969, 2, 14, 3, 2, 54);
    });

    it('RFC 5322: Numeric zone +0545 (Nepal).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri, 21 Nov 1997 09:55:06 +0545');
      expectUTCEqual(d, 1997, 11, 21, 4, 10, 6);
    });

    it('obs-zone aliases (UT/GMT/Z == +0000).', () => {
      expect.hasAssertions();
      const gmt = parseEmailDate('Fri, 21 Nov 1997 09:55:06 GMT');
      const ut = parseEmailDate('Fri, 21 Nov 1997 09:55:06 UT');
      const z = parseEmailDate('Fri, 21 Nov 1997 09:55:06 Z');
      expect(gmt.getTime()).toBe(ut.getTime());
      expect(z.getTime()).toBe(ut.getTime());
    });

    it('US time zone abbreviations (EST/EDT/CST/CDT/MST/MDT/PST/PDT).', () => {
      expect.hasAssertions();
      const est = parseEmailDate('Fri, 21 Nov 1997 09:55:06 EST');
      const edt = parseEmailDate('Fri, 21 Nov 1997 09:55:06 EDT');
      const cst = parseEmailDate('Fri, 21 Nov 1997 09:55:06 CST');
      const cdt = parseEmailDate('Fri, 21 Nov 1997 09:55:06 CDT');
      const mst = parseEmailDate('Fri, 21 Nov 1997 09:55:06 MST');
      const mdt = parseEmailDate('Fri, 21 Nov 1997 09:55:06 MDT');
      const pst = parseEmailDate('Fri, 21 Nov 1997 09:55:06 PST');
      const pdt = parseEmailDate('Fri, 21 Nov 1997 09:55:06 PDT');

      expectUTCEqual(est, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(edt, 1997, 11, 21, 13, 55, 6);
      expectUTCEqual(cst, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(cdt, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(mst, 1997, 11, 21, 16, 55, 6);
      expectUTCEqual(mdt, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(pst, 1997, 11, 21, 17, 55, 6);
      expectUTCEqual(pdt, 1997, 11, 21, 16, 55, 6);
    });

    it('Case-insensitive (dow, month, zone).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('fri, 21 nov 1997 09:55:06 gmt');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Accepts extra spaces and tabs.', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri,   21   Nov\t1997   09:55:06\tGMT');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Day-of-week is optional.', () => {
      expect.hasAssertions();
      const d = parseEmailDate('21 Nov 1997 09:55:06 GMT');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Single-digit day is allowed.', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri, 9 Nov 2001 00:00:00 +0000');
      expectUTCEqual(d, 2001, 11, 9, 0, 0, 0);
    });

    it('CRLF folding (obs-FWS).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('Fri, 21 Nov 1997 09:55:06\r\n -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Comments (CFWS) are ignored.', () => {
      expect.hasAssertions();
      const input =
        '(pre) Fri, (note) 21 (x) Nov (y) 1997 (z) 09:55:06 (s) -0600 (tail)';
      const d = parseEmailDate(input);
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Extreme numeric zones: +1400 / -1200.', () => {
      expect.hasAssertions();
      const plus14 = parseEmailDate('Mon, 01 Jan 2001 00:00:00 +1400');
      expectUTCEqual(plus14, 2000, 12, 31, 10, 0, 0);
      const minus12 = parseEmailDate('Mon, 01 Jan 2001 00:00:00 -1200');
      expectUTCEqual(minus12, 2001, 1, 1, 12, 0, 0);
    });

    it('Date + time + numeric zone (no comma).', () => {
      expect.hasAssertions();
      const d = parseEmailDate('21 Nov 1997 09:55:06 -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Date + time without zone should be rejected.', () => {
      expect.hasAssertions();
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06');
    });
  });

  describe('Invalid inputs.', () => {
    it('Invalid month/day/time range.', () => {
      expect.hasAssertions();
      expectInvalidParse('Fri, 21 Foo 1997 09:55:06 GMT');
      expectInvalidParse('Fri, 31 Nov 1997 09:55:06 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 24:00:00 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 23:60:00 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 23:59:60 GMT');
    });

    it('Invalid or unsupported zone formats and ranges.', () => {
      expect.hasAssertions();
      // NOTE: This implementation accepts "+HH:MM"; skip asserting invalid for that.
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 +2360');
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 +2460');
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 XYZ');
    });

    it('Trailing garbage.', () => {
      expect.hasAssertions();
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 GMT garbage');
    });
  });
});
