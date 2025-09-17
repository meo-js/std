import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import * as netnews from '../../../src/temporal/format/netnews.js';

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

function parseNetnewsDate(input: string): Date {
  const inst = netnews.toInstant(input);
  return new Date(inst.epochMilliseconds);
}

function expectInvalidParse(input: string) {
  let threw = false;
  try {
    const d = parseNetnewsDate(input);
    expect(Number.isNaN(d.getTime())).toBe(true);
  } catch {
    threw = true;
  }
  if (threw) expect(threw).toBe(true);
}

// =============================
// Tests for RFC850 spec.
// =============================
describe('Tests for RFC850 spec.', () => {
  describe('parse', () => {
    it('Parses full weekday name with two-digit year and alphabetic zone.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Friday, 19-Nov-82 16:14:55 EST');
      expectUTCEqual(d, 1982, 11, 19, 21, 14, 55);
    });

    it('Parses different weekdays and months.', () => {
      expect.hasAssertions();
      const d1 = parseNetnewsDate('Monday, 03-Jan-83 08:33:47 MST');
      expectUTCEqual(d1, 1983, 1, 3, 15, 33, 47);

      const d2 = parseNetnewsDate('Saturday, 25-Dec-99 23:59:59 GMT');
      expectUTCEqual(d2, 1999, 12, 25, 23, 59, 59);
    });

    it('Parses case-insensitive weekday and month.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('friday, 19-nov-82 16:14:55 est');
      expectUTCEqual(d, 1982, 11, 19, 21, 14, 55);
    });

    it('Rejects malformed RFC 850 inputs.', () => {
      expect.hasAssertions();
      expectInvalidParse('Friday 19-Nov-82 16:14:55 EST'); // Missing comma.
      expectInvalidParse('Friday, 19/Nov/82 16:14:55 EST'); // Wrong separators.
    });

    it('Rejects weekday that does not match the calendar date (RFC 850).', () => {
      expect.hasAssertions();
      // 1982-11-19 is Friday; labeling as Thursday should be rejected.
      expectInvalidParse('Thursday, 19-Nov-82 16:14:55 EST');
    });
  });

  describe('format', () => {
    it('Canonicalizes RFC 850 inputs to RFC 5536 output.', () => {
      expect.hasAssertions();
      const canon = netnews.format(
        netnews.toZonedDateTime('Friday, 19-Nov-82 16:14:55 EST'),
      );
      expect(canon).toBe('Fri, 19 Nov 1982 16:14:55 -0500');
    });
  });
});

// =============================
// Tests for RFC1036 spec.
// =============================
describe('Tests for RFC1036 spec.', () => {
  describe('parse', () => {
    it('Parses abbreviated weekday with two-digit year.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Fri, 19 Nov 82 16:14:55 GMT');
      expectUTCEqual(d, 1982, 11, 19, 16, 14, 55);
    });

    it('Parses different abbreviated weekdays.', () => {
      expect.hasAssertions();
      const d1 = parseNetnewsDate('Mon, 03 Jan 83 08:33:47 MST');
      expectUTCEqual(d1, 1983, 1, 3, 15, 33, 47);

      const d2 = parseNetnewsDate('Sat, 25 Dec 99 23:59:59 +0000');
      expectUTCEqual(d2, 1999, 12, 25, 23, 59, 59);
    });

    it('Parses without seconds component.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Fri, 19 Nov 82 16:14 GMT');
      expectUTCEqual(d, 1982, 11, 19, 16, 14, 0);
    });

    it('Rejects missing comma after weekday (RFC 1036).', () => {
      expect.hasAssertions();
      expectInvalidParse('Fri 19 Nov 82 16:14:55 GMT');
    });

    it('Rejects weekday that does not match the calendar date (RFC 1036).', () => {
      expect.hasAssertions();
      // 1982-11-19 is Friday; labeling as Thursday should be rejected.
      expectInvalidParse('Thu, 19 Nov 82 16:14:55 GMT');
    });

    it('Interprets two-digit years per RFC 5322 obsolete rules.', () => {
      expect.hasAssertions();
      expect(netnews.parse('01 Nov 49 00:00 +0000').year).toBe(2049);
      expect(netnews.parse('01 Nov 50 00:00 +0000').year).toBe(1950);
    });
  });

  describe('format', () => {
    it('Canonicalizes RFC 1036 inputs to RFC 5536 output.', () => {
      expect.hasAssertions();
      const canon = netnews.format(
        netnews.toZonedDateTime('Fri, 19 Nov 82 16:14:55 GMT'),
      );
      expect(canon).toBe('Fri, 19 Nov 1982 16:14:55 +0000');
    });
  });
});

// =============================
// Tests for RFC5536 spec.
// =============================
describe('Tests for RFC5536 spec.', () => {
  describe('parse', () => {
    it('Parses standard format with four-digit year and numeric offset.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 -0600');
      expectUTCEqual(d, 1997, 11, 21, 15, 55, 6);
    });

    it('Accepts CFWS comments and missing seconds (RFC 5322).', () => {
      expect.hasAssertions();
      const s = ' (comment) Tue, 01 Nov 16 13:23 (x) +0100 ';
      const info = netnews.parse(s);
      const zdt = netnews.toZonedDateTime(s);
      expect(info.year).toBe(2016);
      expect(info.month).toBe(11);
      expect(info.day).toBe(1);
      expect(info.second).toBe(0);
      expect(info.offset).toBe('+01:00');
      expect(zdt.offset).toBe('+01:00');
    });

    it('Accepts GMT as UTC per RFC 5536.', () => {
      expect.hasAssertions();
      const s = '01 Nov 2016 13:23:12 GMT';
      const info = netnews.parse(s);
      expect(info.offset).toBe('+00:00');
      const z = netnews.toZonedDateTime(s);
      expect(z.offset).toBe('+00:00');
    });

    it('Accepts military zone letters (obs-zone) including Z as UTC.', () => {
      expect.hasAssertions();
      const s1 = '01 Nov 2016 13:23:12 n'; // 'n' => -1 hour
      const info1 = netnews.parse(s1);
      expect(info1.offset).toBe('-01:00');

      const s2 = '01 Nov 2016 13:23:12 Z';
      const info2 = netnews.parse(s2);
      expect(info2.offset).toBe('+00:00');
      const z = netnews.toZonedDateTime(s2);
      expect(z.offset).toBe('+00:00');
    });

    it('Accepts US time zone abbreviations (legacy obs-zone).', () => {
      expect.hasAssertions();
      const est = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 EST');
      const edt = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 EDT');
      const cst = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 CST');
      const cdt = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 CDT');
      const mst = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 MST');
      const mdt = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 MDT');
      const pst = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 PST');
      const pdt = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 PDT');

      expectUTCEqual(est, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(edt, 1997, 11, 21, 13, 55, 6);
      expectUTCEqual(cst, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(cdt, 1997, 11, 21, 14, 55, 6);
      expectUTCEqual(mst, 1997, 11, 21, 16, 55, 6);
      expectUTCEqual(mdt, 1997, 11, 21, 15, 55, 6);
      expectUTCEqual(pst, 1997, 11, 21, 17, 55, 6);
      expectUTCEqual(pdt, 1997, 11, 21, 16, 55, 6);
    });

    it('Treats unknown alphabetic zones as -0000 per comparison guidance.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Fri, 21 Nov 1997 09:55:06 XYZ');
      expectUTCEqual(d, 1997, 11, 21, 9, 55, 6);
    });

    it('Rejects colonized numeric offsets like +HH:MM.', () => {
      expect.hasAssertions();
      expectInvalidParse('Thu, 13 Feb 1969 23:32:54 +05:45');
    });

    it('Rejects invalid month/day/time ranges and ISO input.', () => {
      expect.hasAssertions();
      expectInvalidParse('Fri, 21 Foo 1997 09:55:06 GMT');
      expectInvalidParse('Friday, 32-Nov-97 09:55:06 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 24:00:00 GMT');
      expectInvalidParse('Fri, 21 Nov 1997 23:60:00 GMT');
      expectInvalidParse('1997-11-21T09:55:06Z');
    });

    it('Interprets three-digit years per RFC 5322 obsolete rules.', () => {
      expect.hasAssertions();
      const info = netnews.parse('01 Nov 999 00:00 +0000');
      // 999 should be interpreted as 999 + 1900 = 2899.
      expect(info.year).toBe(2899);
    });

    it('Maps year 099 to 1999 per three-digit rule.', () => {
      expect.hasAssertions();
      const info = netnews.parse('Fri, 01 Jan 099 00:00:00 +0000');
      expect(info.year).toBe(1999);
    });

    it('Accepts leap second with second value 60.', () => {
      expect.hasAssertions();
      const info = netnews.parse('Wed, 31 Dec 1998 23:59:60 +0000');
      expect(info.second).toBe(60);
      expect(info.offset).toBe('+00:00');
    });

    it('Rejects weekday that does not match the calendar date (RFC 5536).', () => {
      expect.hasAssertions();
      // 1997-11-21 is Friday; labeling as Thursday should be rejected.
      expectInvalidParse('Thu, 21 Nov 1997 09:55:06 +0000');
    });

    it('Parses RFC 5322 official example with half-hour offset.', () => {
      expect.hasAssertions();
      const d = parseNetnewsDate('Thu, 13 Feb 1969 23:32:54 -0330');
      // -0330 means UTC is local + 3h30m -> 1969-02-14 03:02:54Z.
      expectUTCEqual(d, 1969, 2, 14, 3, 2, 54);
    });

    it('Accepts UT as UTC per RFC 5322 obsolete zone.', () => {
      expect.hasAssertions();
      const info = netnews.parse('01 Nov 2016 13:23:12 UT');
      expect(info.offset).toBe('+00:00');
    });

    it('Parses all three historical forms as the same instant.', () => {
      expect.hasAssertions();
      const rfc850 = parseNetnewsDate('Friday, 19-Nov-82 16:14:55 EST');
      const rfc1036 = parseNetnewsDate('Fri, 19 Nov 82 16:14:55 EST');
      const rfc5536 = parseNetnewsDate('Fri, 19 Nov 1982 16:14:55 -0500');
      expect(rfc850.getTime()).toBe(rfc1036.getTime());
      expect(rfc1036.getTime()).toBe(rfc5536.getTime());
    });
  });

  describe('format', () => {
    it('Generates four-digit year and numeric offset (+HHMM).', () => {
      expect.hasAssertions();
      const z = Temporal.ZonedDateTime.from(
        '2016-11-01T13:23:12+01:00[+01:00]',
      );
      const s = netnews.format(z);
      expect(s).toBe('Tue, 01 Nov 2016 13:23:12 +0100');

      const inst = Temporal.Instant.from('2000-01-01T00:00:00Z');
      expect(netnews.format(inst)).toMatch(/\+0000$/u);

      const pdt = Temporal.PlainDateTime.from('2000-01-01T00:00:00');
      expect(netnews.format(pdt)).toMatch(/\b2000\b/u);
      expect(netnews.format(pdt)).toMatch(/\+0000$/u);

      const pd = Temporal.PlainDate.from('2000-01-01');
      expect(netnews.format(pd)).toMatch(/00:00:00/u);
      expect(netnews.format(pd)).toMatch(/\+0000$/u);
    });

    it('Canonicalizes mixed RFC 850/1036/5536 inputs to the same output.', () => {
      expect.hasAssertions();
      const c850 = netnews.format(
        netnews.toZonedDateTime('Friday, 19-Nov-82 16:14:55 EST'),
      );
      const c1036 = netnews.format(
        netnews.toZonedDateTime('Fri, 19 Nov 82 16:14:55 EST'),
      );
      const c5536 = netnews.format(
        netnews.toZonedDateTime('Fri, 19 Nov 1982 16:14:55 -0500'),
      );
      expect(c850).toBe('Fri, 19 Nov 1982 16:14:55 -0500');
      expect(c1036).toBe('Fri, 19 Nov 1982 16:14:55 -0500');
      expect(c5536).toBe('Fri, 19 Nov 1982 16:14:55 -0500');
    });

    it('Formats Z (UTC) and obs-zone inputs to +0000 in output.', () => {
      expect.hasAssertions();
      const z = netnews.toZonedDateTime('01 Nov 2016 13:23:12 Z');
      expect(netnews.format(z)).toMatch(/\+0000$/u);
      const gmt = netnews.toZonedDateTime('Sun, 06 Nov 1994 08:49:37 GMT');
      expect(netnews.format(gmt)).toMatch(/\+0000$/u);
    });
  });
});
