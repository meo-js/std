import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import * as cookie from '../../../src/temporal/format/cookie.js';

// Helpers.
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

function parseCookieDate(input: string): Date {
  const inst = cookie.toInstant(input);
  return new Date(inst.epochMilliseconds);
}

function expectInvalidParse(input: string) {
  let threw = false;
  try {
    const d = parseCookieDate(input);
    expect(Number.isNaN(d.getTime())).toBe(true);
  } catch {
    threw = true;
  }
  if (threw) expect(threw).toBe(true);
}

// =============================
// Tests for Netscape/Original and RFC2109 (historic compatibility).
// =============================
describe('Tests for RFC2109 spec (historic Netscape Expires compatibility).', () => {
  describe('parse', () => {
    it('Parses the fixed-length Netscape format with two-digit year.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('Wed, 09-Jun-21 10:18:14 GMT');
      expectUTCEqual(d, 2021, 6, 9, 10, 18, 14);
    });

    it('Accepts full weekday names and hyphenated date tokens.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('Wednesday, 09-Jun-99 23:59:59 GMT');
      expectUTCEqual(d, 1999, 6, 9, 23, 59, 59);
    });

    it('Is case-insensitive for tokens and tolerates extra whitespace.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('wEdNeSdAy,  09-jUn-21   10:18:14   gMt');
      expectUTCEqual(d, 2021, 6, 9, 10, 18, 14);
    });
  });

  describe('format', () => {
    it('Formats to RFC 1123 style with GMT (canonical output).', () => {
      expect.hasAssertions();
      const z = Temporal.ZonedDateTime.from('2021-06-09T10:18:14+00:00[UTC]');
      const s = cookie.format(z);
      expect(s).toBe('Wed, 09 Jun 2021 10:18:14 GMT');
    });
  });
});

// =============================
// Tests for RFC2965 spec (historic; Set-Cookie2, but ensure legacy dates parse).
// =============================
describe('Tests for RFC2965 spec (historic compatibility).', () => {
  describe('parse', () => {
    it('Parses two-digit years per compatibility guidance.', () => {
      expect.hasAssertions();
      const y49 = cookie.parse('Wed, 01 Nov 49 00:00:00 GMT');
      const y50 = cookie.parse('Wed, 01 Nov 50 00:00:00 GMT');
      expect(y49.year).toBe(2049);
      expect(y50.year).toBe(2050);
    });

    it('Parses with varied separators and optional comma.', () => {
      expect.hasAssertions();
      const d1 = parseCookieDate('Wed, 09 Jun 2021 10:18:14 GMT');
      expectUTCEqual(d1, 2021, 6, 9, 10, 18, 14);
      const d2 = parseCookieDate('09 Jun 2021 10:18:14 GMT');
      expectUTCEqual(d2, 2021, 6, 9, 10, 18, 14);
    });
  });

  describe('format', () => {
    it('Always emits four-digit year and GMT zone in output.', () => {
      expect.hasAssertions();
      const z = Temporal.ZonedDateTime.from(
        '1999-06-09T23:59:59-05:00[-05:00]',
      );
      const s = cookie.format(z);
      // 23:59:59 -0500 => 04:59:59 GMT next day 10th.
      expect(s).toBe('Thu, 10 Jun 1999 04:59:59 GMT');
    });
  });
});

// =============================
// Tests for RFC6265 spec (current; parsing algorithm and canonical output).
// =============================
describe('Tests for RFC6265 spec.', () => {
  describe('parse', () => {
    it('Parses standard RFC 1123 date.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('Sun, 06 Nov 1994 08:49:37 GMT');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Parses with single-digit day.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('Sun, 6 Nov 1994 08:49:37 GMT');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Parses case-insensitively for month and weekday names.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('sun, 06 nov 1994 08:49:37 gmt');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Parses tokenized variants per algorithm (extra tokens and tabs).', () => {
      expect.hasAssertions();
      const d = parseCookieDate('\tSun, 06 Nov 1994 08:49:37 GMT foo bar');
      expectUTCEqual(d, 1994, 11, 6, 8, 49, 37);
    });

    it('Ignores incorrect weekday token and still parses.', () => {
      expect.hasAssertions();
      // 2021-06-09 is actually Wednesday, but the weekday token says "Sun".
      const d = parseCookieDate('Sun, 09 Jun 2021 10:18:14 GMT');
      expectUTCEqual(d, 2021, 6, 9, 10, 18, 14);
    });

    it('Accepts missing comma after weekday per non-alnum tokenization.', () => {
      expect.hasAssertions();
      const d = parseCookieDate('Wed 09 Jun 2021 10:18:14 GMT');
      expectUTCEqual(d, 2021, 6, 9, 10, 18, 14);
    });

    it('Maps two-digit years: 70-99 => 1970-1999, 00-69 => 2000-2069.', () => {
      expect.hasAssertions();
      const y70 = cookie.parse('Sun, 06 Nov 70 00:00:00 GMT');
      const y99 = cookie.parse('Sun, 06 Nov 99 00:00:00 GMT');
      const y00 = cookie.parse('Sun, 06 Nov 00 00:00:00 GMT');
      const y69 = cookie.parse('Sun, 06 Nov 69 00:00:00 GMT');
      expect(y70.year).toBe(1970);
      expect(y99.year).toBe(1999);
      expect(y00.year).toBe(2000);
      expect(y69.year).toBe(2069);
    });

    it('Rejects invalid ranges and years < 1601 per RFC6265.', () => {
      expect.hasAssertions();
      expectInvalidParse('Sun, 06 Nov 1500 08:49:37 GMT');
      expectInvalidParse('Sun, 06 Nov 1994 24:00:00 GMT');
      expectInvalidParse('Sun, 06 Nov 1994 23:60:00 GMT');
      expectInvalidParse('Sun, 06 Nov 1994 23:59:60 GMT');
      expectInvalidParse('Sun, 32 Nov 1994 08:49:37 GMT');
      expectInvalidParse('Sun, 06 Foo 1994 08:49:37 GMT');
      expectInvalidParse('Sun, 06 Nov 1994 08:49 GMT'); // Missing seconds.
    });

    it('Accepts lower bound year 1601 and rejects 1600.', () => {
      expect.hasAssertions();
      const ok = parseCookieDate('Mon, 01 Jan 1601 00:00:00 GMT');
      expectUTCEqual(ok, 1601, 1, 1, 0, 0, 0);
      expectInvalidParse('Mon, 01 Jan 1600 00:00:00 GMT');
    });

    it('Rejects five-digit year (more than four digits).', () => {
      expect.hasAssertions();
      expectInvalidParse('Wed, 01 Jan 10000 00:00:00 GMT');
    });

    it('Ignores timezone tokens; treats time as UTC.', () => {
      expect.hasAssertions();
      const gmt = parseCookieDate('Wed, 09 Jun 2021 10:18:14 GMT');
      const utc = parseCookieDate('Wed, 09 Jun 2021 10:18:14 UTC');
      expect(gmt.getTime()).toBe(utc.getTime());
    });
  });

  describe('format', () => {
    it('Always outputs GMT with four-digit year and zero-padded fields.', () => {
      expect.hasAssertions();
      const z = Temporal.ZonedDateTime.from(
        '2016-11-01T13:23:12+01:00[+01:00]',
      );
      const s = cookie.format(z);
      // Convert to UTC.
      expect(s).toBe('Tue, 01 Nov 2016 12:23:12 GMT');
      // Shape checks.
      expect(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/u.test(s)).toBe(
        true,
      );
    });

    it('Formats {@link Temporal.Instant}, {@link Temporal.PlainDateTime}, and {@link Temporal.PlainDate}.', () => {
      expect.hasAssertions();
      const inst = Temporal.Instant.from('2000-01-01T00:00:00Z');
      expect(cookie.format(inst)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');

      const pdt = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
      expect(cookie.format(pdt)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');

      const pd = Temporal.PlainDate.from('2000-01-01');
      expect(cookie.format(pd)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');
    });

    it('Rounds to whole seconds when formatting.', () => {
      expect.hasAssertions();
      const up = Temporal.ZonedDateTime.from(
        '2000-01-01T00:00:00.600+00:00[+00:00]',
      );
      expect(cookie.format(up)).toBe('Sat, 01 Jan 2000 00:00:01 GMT');
      const down = Temporal.ZonedDateTime.from(
        '2000-01-01T00:00:00.400+00:00[+00:00]',
      );
      expect(cookie.format(down)).toBe('Sat, 01 Jan 2000 00:00:00 GMT');
    });
  });

  describe('conversions', () => {
    it('toZonedDateTime/toInstant/toDate work and are UTC-based.', () => {
      expect.hasAssertions();
      const s = 'Wed, 09 Jun 2021 10:18:14 GMT';
      const zdt = cookie.toZonedDateTime(s);
      expect(zdt.offset).toBe('+00:00');
      const inst = cookie.toInstant(s);
      expect(inst.epochMilliseconds).toBe(zdt.epochMilliseconds);
      const d = cookie.toDate(s);
      expect(d.year).toBe(2021);
      expect(d.month).toBe(6);
      expect(d.day).toBe(9);
    });

    it('toDateTime/toTime extract logical components.', () => {
      expect.hasAssertions();
      const s = 'Sun, 06 Nov 1994 08:49:37 GMT';
      const dt = cookie.toDateTime(s);
      expect(dt.year).toBe(1994);
      expect(dt.month).toBe(11);
      expect(dt.day).toBe(6);
      expect(dt.hour).toBe(8);
      expect(dt.minute).toBe(49);
      expect(dt.second).toBe(37);
      const t = cookie.toTime(s);
      expect(t.hour).toBe(8);
      expect(t.minute).toBe(49);
      expect(t.second).toBe(37);
    });
  });
});
