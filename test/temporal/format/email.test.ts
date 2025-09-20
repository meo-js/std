import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import * as email from '../../../src/temporal/format/email.js';

// Helpers for validation via Instant conversion.
function toDate(input: string): Date {
  const inst = email.toInstant(input);
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
// Tests for RFC 5322 (Internet Message Format) §3.3 and §4.3.
// Generation must be canonical; obsolete forms must be accepted.
// =============================================================
describe('Tests for RFC 5322 spec.', () => {
  describe('format', () => {
    it('Generates canonical "Date" with numeric timezone and single spaces.', () => {
      const z = Temporal.ZonedDateTime.from(
        '2016-11-01T13:23:12+01:00[+01:00]',
      );
      const s = email.format(z);
      expect(s).toBe('Tue, 01 Nov 2016 13:23:12 +0100');
      expect(
        /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/u.test(
          s,
        ),
      ).toBe(true);
      expect(s.includes('  ')).toBe(false);
      expect(s.includes('GMT') || s.includes('UT') || s.endsWith(' Z')).toBe(
        false,
      );
    });

    it('Accepts Instant/PlainDateTime/PlainDate and normalizes to UTC for those types.', () => {
      const inst = Temporal.Instant.from('2000-01-01T00:00:00Z');
      expect(email.format(inst)).toBe('Sat, 01 Jan 2000 00:00:00 +0000');

      const pdt = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
      expect(email.format(pdt)).toBe('Sat, 01 Jan 2000 00:00:00 +0000');

      const pd = Temporal.PlainDate.from('2000-01-01');
      expect(email.format(pd)).toBe('Sat, 01 Jan 2000 00:00:00 +0000');
    });

    it('Rounds sub-second fractions to the nearest second before formatting.', () => {
      const base = Temporal.ZonedDateTime.from(
        '2000-01-01T00:00:00.600+00:00[UTC]',
      );
      expect(email.format(base)).toBe('Sat, 01 Jan 2000 00:00:01 +0000');
    });

    it('Rejects unsupported PlainTime input.', () => {
      // @ts-expect-error: plain time is not supported for formatting
      expect(() => email.format(Temporal.PlainTime.from('00:00:00'))).toThrow();
    });
  });

  describe('parse', () => {
    it('Accepts numeric zone (preferred) and returns correct instant.', () => {
      const d = toDate('Fri, 21 Nov 1997 09:55:06 -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Accepts UT/GMT/Z as +0000 (obs-zone).', () => {
      const gmt = toDate('Fri, 21 Nov 1997 09:55:06 GMT');
      const ut = toDate('Fri, 21 Nov 1997 09:55:06 UT');
      const z = toDate('Fri, 21 Nov 1997 09:55:06 Z');
      expect(gmt.getTime()).toBe(ut.getTime());
      expect(z.getTime()).toBe(ut.getTime());
    });

    it('Accepts military time zones per obs-zone.', () => {
      const a = toDate('Fri, 21 Nov 1997 09:55:06 A');
      const n = toDate('Fri, 21 Nov 1997 09:55:06 N');
      const k = toDate('Fri, 21 Nov 1997 09:55:06 K');
      expect(Number.isNaN(a.getTime())).toBe(false);
      expect(Number.isNaN(n.getTime())).toBe(false);
      expect(Number.isNaN(k.getTime())).toBe(false);
    });

    it('Accepts US time zone abbreviations (EST/EDT/CST/CDT/MST/MDT/PST/PDT).', () => {
      const est = toDate('Fri, 21 Nov 1997 09:55:06 EST');
      const edt = toDate('Fri, 21 Nov 1997 09:55:06 EDT');
      const cst = toDate('Fri, 21 Nov 1997 09:55:06 CST');
      const cdt = toDate('Fri, 21 Nov 1997 09:55:06 CDT');
      const mst = toDate('Fri, 21 Nov 1997 09:55:06 MST');
      const mdt = toDate('Fri, 21 Nov 1997 09:55:06 MDT');
      const pst = toDate('Fri, 21 Nov 1997 09:55:06 PST');
      const pdt = toDate('Fri, 21 Nov 1997 09:55:06 PDT');
      expectUTCEqual(est, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(edt, 1997, 11, 21, 13, 55, 6);
      expectUTCEqual(cst, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(cdt, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(mst, 1997, 11, 21, 16, 55, 6);
      expectUTCEqual(mdt, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(pst, 1997, 11, 21, 17, 55, 6);
      expectUTCEqual(pdt, 1997, 11, 21, 16, 55, 6);
    });

    it('Accepts half-hour and quarter-hour offsets (e.g., -0330, +0545).', () => {
      expectUTCEqual(
        toDate('Thu, 13 Feb 1969 23:32:54 -0330'),
        1969,
        2,
        14,
        3,
        2,
        54,
      );
      expectUTCEqual(
        toDate('Fri, 21 Nov 1997 09:55:06 +0545'),
        1997,
        11,
        21,
        4,
        10,
        6,
      );
    });

    it('Accepts two-digit and three-digit years as obsolete forms with defined mapping.', () => {
      expect(email.parse('01 Nov 49 00:00 +0000').year).toBe(2049);
      expect(email.parse('01 Nov 50 00:00 +0000').year).toBe(1950);
      expect(email.parse('01 Nov 999 00:00 +0000').year).toBe(2899);
    });

    it('Accepts CFWS and obs-FWS around tokens (A.6.3 style).', () => {
      const s = 'Fri, (c1) 21 (c2) Nov (c3) 1997 09:55:06 (c4) -0600';
      const d = toDate(s);
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Accepts missing seconds (defaults to 0).', () => {
      const d = toDate('Fri, 21 Nov 1997 09:55 -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 0);
    });

    it('Accepts optional day-of-week and single-digit day.', () => {
      expectUTCEqual(
        toDate('21 Nov 1997 09:55:06 GMT'),
        1997,
        11,
        21,
        9,
        55,
        6,
      );
      expectUTCEqual(
        toDate('Fri, 9 Nov 2001 00:00:00 +0000'),
        2001,
        11,
        9,
        0,
        0,
        0,
      );
    });

    it('Is case-insensitive for day/month/zone tokens.', () => {
      const d = toDate('fri, 21 nov 1997 09:55:06 gmt');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Requires a comma after day-of-week when present.', () => {
      expectInvalidParse('Fri 21 Nov 1997 09:55:06 +0000');
    });

    it('Treats unknown alphabetic zones as "-0000" (handle as UTC for conversion).', () => {
      const cet = toDate('Fri, 21 Nov 1997 09:55:06 CET');
      expectUTCEqual(cet, 1997, 11, 21, 9, 55, 6);
      const xyz = toDate('Fri, 21 Nov 1997 09:55:06 XYZ');
      expectUTCEqual(xyz, 1997, 11, 21, 9, 55, 6);
    });

    it('Is tolerant of case for month and zone abbreviations.', () => {
      const d = toDate('Fri, 21 NOV 1997 09:55:06 gMt');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Accepts "-0000" and treats it as UTC for conversion semantics.', () => {
      const d1 = toDate('Fri, 21 Nov 1997 09:55:06 -0000');
      const d2 = toDate('Fri, 21 Nov 1997 09:55:06 +0000');
      expect(d1.getTime()).toBe(d2.getTime());
      const zdt = email.toZonedDateTime('Fri, 21 Nov 1997 09:55:06 -0000');
      expect(zdt.offset).toBe('+00:00');
    });

    it('Rejects mismatched day-of-week and invalid ranges.', () => {
      expectInvalidParse('Sun, 21 Nov 1997 09:55:06 GMT'); // 1997-11-21 is Friday.
      expectInvalidParse('Fri, 31 Nov 1997 09:55:06 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 24:00:00 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 23:60:00 GMT');
    });

    it('Preserves second value 60 in parse results and clamps Temporal conversions.', () => {
      const sample = 'Sat, 31 Dec 2016 23:59:60 +0000';
      const info = email.parse(sample);
      expect(info.second).toBe(60);
      expect(email.toInstant(sample).toString()).toBe('2016-12-31T23:59:59Z');
      expect(email.toTime(sample).second).toBe(59);
    });

    it('Rejects missing zone and trailing garbage; validates zone minutes range.', () => {
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06');
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 GMT garbage');
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 +2360');
      expectInvalidParse('Fri, 21 Nov 1997 09:55:06 J');
    });

    it('Accepts unknown multi-letter alphabetic time zones as -0000.', () => {
      const info = email.parse('Fri, 21 Nov 1997 09:55:06 XYZ');
      expect(info.offset).toBe('+00:00');
      const zdt = email.toZonedDateTime('Fri, 21 Nov 1997 09:55:06 XYZ');
      expect(zdt.offset).toBe('+00:00');
    });

    describe('Edge cases: leap years and year bounds.', () => {
      it('Accepts Feb 29 in a leap year (2000 is leap year).', () => {
          const d = toDate('29 Feb 2000 12:00:00 +0000');
        expectUTCEqual(d, 2000, 2, 29, 12, 0, 0);
      });

      it('Rejects Feb 29 in 1900 (not a leap year).', () => {
          expectInvalidParse('29 Feb 1900 00:00:00 +0000');
      });

      it('Rejects Feb 29 in a common year (1999).', () => {
          expectInvalidParse('29 Feb 1999 00:00:00 +0000');
      });

      it('Accepts lower bound year 1900.', () => {
          const d = toDate('01 Jan 1900 00:00:00 +0000');
        expectUTCEqual(d, 1900, 1, 1, 0, 0, 0);
      });

      it('Rejects year earlier than 1900.', () => {
          expectInvalidParse('01 Jan 1899 00:00:00 +0000');
      });

      it('Accepts 5+ digit year (>= 10000) per RFC 5322/2822.', () => {
          const info = email.parse('01 Jan 10000 00:00:00 +0000');
        expect(info.year).toBe(10000);
      });

      it('Accepts leap second 23:59:60 per RFC 5322 §3.3.', () => {
          const info = email.parse('31 Dec 1998 23:59:60 +0000');
        expect(info.second).toBe(60);
        expect(info.offset).toBe('+00:00');
      });
    });
  });

  describe('toXxx conversions', () => {
    it('Converts parsed Date field to Date/Time/PlainDateTime/Instant/ZonedDateTime properly.', () => {
      const s = 'Tue, 15 Nov 1994 08:12:31 -0500';
      const date = email.toDate(s);
      const time = email.toTime(s);
      const dt = email.toDateTime(s);
      const inst = email.toInstant(s);
      const zdt = email.toZonedDateTime(s);

      // Local wall-clock components from the field value.
      expect(date.toString()).toBe('1994-11-15');
      expect(time.toString()).toBe('08:12:31');
      expect(dt.toString()).toBe('1994-11-15T08:12:31');

      // Absolute instant in UTC.
      expect(inst.toString()).toBe('1994-11-15T13:12:31Z');
      expect(zdt.offset).toMatch(/[+-]\d{2}:\d{2}/u);
    });
  });
});

// ======================================
// Tests for RFC 2822 (obsolete, accepted).
// ======================================
describe('Tests for RFC 2822 spec (obsolete forms allowed for parsing).', () => {
  describe('parse', () => {
    it('Accepts obsolete date with non-numeric zone and two-digit year (A.6.2).', () => {
      const d = toDate('21 Nov 97 09:55:06 GMT');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Accepts folding white space and comments in many positions (A.5/A.6.3).', () => {
      const s = 'Thu,\r\n 13 (x) Feb (y) 1969 23:32 -0330 (Newfoundland Time)';
      const d = toDate(s);
      expectUTCEqual(d, 1969, 2, 14, 3, 2, 0);
    });
  });

  describe('format', () => {
    it('Sender MUST NOT generate two-digit years or non-numeric zones.', () => {
      const z = Temporal.ZonedDateTime.from(
        '2003-07-01T10:52:37+02:00[+02:00]',
      );
      const s = email.format(z);
      expect(s).toBe('Tue, 01 Jul 2003 10:52:37 +0200');
      expect(s).not.toMatch(/\bGMT\b|\bUT\b|\b[A-Z]{3}\b/u);
    });
  });
});

// ==============================================
// Tests for RFC 1123 and RFC 822 (historic input).
// ==============================================
describe('Tests for RFC 1123 and RFC 822 spec.', () => {
  describe('parse', () => {
    it('Accepts RFC 1123 style (four-digit year, GMT token).', () => {
      expectUTCEqual(
        toDate('Sun, 06 Nov 1994 08:49:37 GMT'),
        1994,
        11,
        6,
        8,
        49,
        37,
      );
    });

    it('Accepts RFC 822 style (two-digit year and named zone).', () => {
      expectUTCEqual(
        toDate('Fri, 21 Nov 97 09:55:06 GMT'),
        1997,
        11,
        21,
        9,
        55,
        6,
      );
    });
  });
});
