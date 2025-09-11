/**
 * Internet Message Format (Email) date-time parsing/formatting (RFC 5322)
 * with compatibility for obsolete forms from RFC 822 / RFC 1123 / RFC 2822.
 *
 * @internal
 * @module
 */
import { Temporal } from 'temporal-polyfill';
import type { TemporalInfo } from '../shared.js';

// Month and weekday tables per RFC grammar.
const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

const MONTH_INDEX: Record<string, number | undefined> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// TZ name mapping (obs-zone) from RFC 822/2822, with military zones expanded statically.
const OBS_TZ: Record<string, number> = {
  // Common aliases
  ut: 0,
  gmt: 0,
  utc: 0,
  // US time zones (obsolete names)
  edt: -4 * 60,
  est: -5 * 60,
  cdt: -5 * 60,
  cst: -6 * 60,
  mdt: -6 * 60,
  mst: -7 * 60,
  pdt: -7 * 60,
  pst: -8 * 60,
  // Military time zones A..I, K..M, N..Y, Z (J not used). Lowercase keys.
  a: 1 * 60,
  b: 2 * 60,
  c: 3 * 60,
  d: 4 * 60,
  e: 5 * 60,
  f: 6 * 60,
  g: 7 * 60,
  h: 8 * 60,
  i: 9 * 60,
  // Note: values mirror existing runtime behavior
  k: 9 * 60,
  l: 10 * 60,
  m: 11 * 60,
  n: -1 * 60,
  o: -2 * 60,
  p: -3 * 60,
  q: -4 * 60,
  r: -5 * 60,
  s: -6 * 60,
  t: -7 * 60,
  u: -8 * 60,
  v: -9 * 60,
  w: -10 * 60,
  x: -11 * 60,
  y: -12 * 60,
  z: 0,
};

// Remove comments (CFWS): drop nested parentheses content.
function stripComments(s: string): string {
  let out = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') {
      depth++;
    } else if (c === ')') {
      if (depth > 0) depth--;
      else out += c; // unmatched, keep
    } else if (depth === 0) {
      out += c;
    }
  }
  return out;
}

const UNFOLD_RE = /\r\n[\t ]+/gu;
const WSP_RE = /[\t ]+/gu;
function normalizeWS(s: string): string {
  // unfold CRLF + WSP and collapse multiple spaces
  return s.replace(UNFOLD_RE, ' ').replace(WSP_RE, ' ').trim();
}

function parseMonth(mon: string): number {
  const idx = MONTH_INDEX[mon.toLowerCase()];
  if (idx === undefined) throw new RangeError(`Invalid month: ${mon}.`);
  return idx;
}

function parseYear(y: string): number {
  if (y.length === 2) {
    // RFC 2822 4.3: 00..49 => 2000..2049, 50..99 => 1950..1999
    const n = Number.parseInt(y, 10);
    return n < 50 ? 2000 + n : 1900 + n;
  }
  if (y.length === 3) {
    // extremely obsolete; assume 1900s like 3-digit years => 1900 + y
    const n = Number.parseInt(y, 10);
    if (!Number.isFinite(n)) throw new RangeError('Invalid year.');
    return 1900 + n;
  }
  const n = Number.parseInt(y, 10);
  if (!Number.isFinite(n)) throw new RangeError('Invalid year.');
  return n;
}

function parseOffsetToken(tz: string): number {
  const s = tz.toLowerCase();
  if (s in OBS_TZ) return OBS_TZ[s];
  if (s === 'z') return 0;
  // "+HHMM", "+HH:MM", "-HHMM", "-HH:MM"
  const m = /^([+-])(\d{2})(?::?(\d{2}))?$/u.exec(s);
  if (m) {
    const sign = m[1] === '-' ? -1 : 1;
    const hh = Number.parseInt(m[2], 10);
    const mm = m[3] ? Number.parseInt(m[3], 10) : 0;
    if (hh > 23 || mm > 59)
      throw new RangeError(`Invalid numeric zone: ${tz}.`);
    return sign * (hh * 60 + mm);
  }
  throw new RangeError(`Unrecognized time zone: ${tz}.`);
}

function formatOffset(
  minutes: number,
  colon: boolean,
  zForZero: boolean,
): string {
  if (minutes === 0 && zForZero) return 'Z';
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hh = String(Math.trunc(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return colon ? `${sign}${hh}:${mm}` : `${sign}${hh}${mm}`;
}

const PARSE_RE =
  /^(?:([A-Za-z]{3}),\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([^\s]+)$/u;

/**
 * Parse RFC 5322 (and obsolete) date-time text into TemporalInfo.
 */
export function parse(
  text: string,
  out: Partial<TemporalInfo>,
): Partial<TemporalInfo> {
  // Basic normalization
  const s = normalizeWS(stripComments(text));

  // Optional leading day-name followed by comma
  const m = PARSE_RE.exec(s);
  if (!m) {
    throw new RangeError(`Invalid RFC 5322 date-time: ${text}.`);
  }

  // m[1] is optional day-name, ignored for validation to remain lenient
  const day = Number.parseInt(m[2], 10);
  const month = parseMonth(m[3]);
  const year = parseYear(m[4]);
  const hour = Number.parseInt(m[5], 10);
  const minute = Number.parseInt(m[6], 10);
  const second = m[7] ? Number.parseInt(m[7], 10) : 0;
  const tzToken = m[8];

  if (hour > 23 || minute > 59 || second > 59) {
    throw new RangeError(`Invalid time in: ${text}.`);
  }

  const offsetMinutes = parseOffsetToken(tzToken);

  out.year = year;
  out.era = undefined;
  out.eraYear = undefined;
  out.month = month;
  out.monthCode = undefined;
  out.day = day;
  out.hour = hour;
  out.minute = minute;
  out.second = second;
  out.millisecond = 0;
  out.microsecond = 0;
  out.nanosecond = 0;
  // Always set RFC9557-like numeric offset for Temporal offset field
  const numericOffset = formatOffset(offsetMinutes, true, false);
  out.offset = numericOffset;
  // Use fixed-offset time zone id (e.g., "+08:00") for ZDT construction
  out.timeZone = numericOffset;
  return out;
}

/**
 * Format ZonedDateTime into strict RFC 5322 string.
 * Example: "Tue, 01 Nov 2016 13:23:12 +0100"
 */
export function format(zdt: Temporal.ZonedDateTime): string {
  // Day of week: Temporal: 1=Mon..7=Sun
  const dow = DOW[zdt.dayOfWeek % 7];
  const dd = String(zdt.day).padStart(2, '0');
  const monName = MONTHS[zdt.month - 1];
  const mon = monName[0].toUpperCase() + monName.slice(1);
  const year = zdt.year;
  if (year < 0 || year > 9999) {
    throw new RangeError('RFC 5322 requires four-digit year (0000..9999).');
  }
  const hh = String(zdt.hour).padStart(2, '0');
  const mm = String(zdt.minute).padStart(2, '0');
  const ss = String(zdt.second).padStart(2, '0');
  const offsetMinutes = Math.trunc(zdt.offsetNanoseconds / 60_000_000_000);
  const zone = formatOffset(offsetMinutes, false, false);
  return `${dow}, ${dd} ${mon} ${String(year).padStart(4, '0')} ${hh}:${mm}:${ss} ${zone}`;
}
