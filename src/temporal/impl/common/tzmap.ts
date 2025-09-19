/**
 * Obsolete timezone name mappings for RFC compatibility.
 * Maps obsolete timezone names to offset minutes for parsing.
 *
 * @internal
 * @module
 */

/**
 * Obsolete timezone name to offset minutes mapping.
 * Per RFC 822/1123/2822/5322 specifications.
 *
 * Note: Military timezones A-I, K-Z have semantically "reversed" meanings
 * per RFC 1123, so they don't carry reliable information.
 */
export const OBSOLETE_TIMEZONE_MAP: Record<string, number | undefined> = {
  // Universal time
  'ut': 0,
  'gmt': 0,
  'utc': 0,

  // US timezone names (obsolete per RFC 5322)
  'edt': -4 * 60, // Eastern Daylight Time
  'est': -5 * 60, // Eastern Standard Time
  'cdt': -5 * 60, // Central Daylight Time
  'cst': -6 * 60, // Central Standard Time
  'mdt': -6 * 60, // Mountain Daylight Time
  'mst': -7 * 60, // Mountain Standard Time
  'pdt': -7 * 60, // Pacific Daylight Time
  'pst': -8 * 60, // Pacific Standard Time

  // Military timezone letters A-I, K-Z (J is not used)
  // Note: These have "reversed" semantics per RFC 1123
  'a': 1 * 60, // Alpha (+01:00)
  'b': 2 * 60, // Bravo (+02:00)
  'c': 3 * 60, // Charlie (+03:00)
  'd': 4 * 60, // Delta (+04:00)
  'e': 5 * 60, // Echo (+05:00)
  'f': 6 * 60, // Foxtrot (+06:00)
  'g': 7 * 60, // Golf (+07:00)
  'h': 8 * 60, // Hotel (+08:00)
  'i': 9 * 60, // India (+09:00)
  // J is intentionally skipped in military time
  'k': 10 * 60, // Kilo (+10:00)
  'l': 11 * 60, // Lima (+11:00)
  'm': 12 * 60, // Mike (+12:00)
  'n': -1 * 60, // November (-01:00)
  'o': -2 * 60, // Oscar (-02:00)
  'p': -3 * 60, // Papa (-03:00)
  'q': -4 * 60, // Quebec (-04:00)
  'r': -5 * 60, // Romeo (-05:00)
  's': -6 * 60, // Sierra (-06:00)
  't': -7 * 60, // Tango (-07:00)
  'u': -8 * 60, // Uniform (-08:00)
  'v': -9 * 60, // Victor (-09:00)
  'w': -10 * 60, // Whiskey (-10:00)
  'x': -11 * 60, // X-ray (-11:00)
  'y': -12 * 60, // Yankee (-12:00)
  'z': 0, // Zulu (UTC)
};

/**
 * Parse timezone token and return offset in minutes.
 * Handles both numeric offsets and obsolete timezone names.
 *
 * @param tz Timezone token (e.g., "+0800", "GMT", "PST", "Z")
 * @returns Object with offset in minutes and source type
 * @throws {RangeError} If timezone is unrecognized
 */
export function parseTimezone(tz: string): {
  offsetMinutes: number;
  sourceTz: 'numeric' | 'obs-name';
} {
  const normalized = tz.toLowerCase();

  // Handle 'Z' special case
  if (normalized === 'z') {
    return { offsetMinutes: 0, sourceTz: 'numeric' };
  }

  // Check obsolete timezone names
  const obsOffset = OBSOLETE_TIMEZONE_MAP[normalized];
  if (obsOffset !== undefined) {
    return { offsetMinutes: obsOffset, sourceTz: 'obs-name' };
  }

  // Parse numeric offset: +HHMM, -HHMM, +HH:MM, -HH:MM
  const numericMatch = /^([+-])(\d{2})(?::?(\d{2}))?$/u.exec(tz);
  if (numericMatch) {
    const sign = numericMatch[1] === '-' ? -1 : 1;
    const hours = Number.parseInt(numericMatch[2], 10);
    const minutes = numericMatch[3] ? Number.parseInt(numericMatch[3], 10) : 0;

    if (hours > 23 || minutes > 59) {
      throw new RangeError(`Invalid numeric timezone: ${tz}.`);
    }

    return {
      offsetMinutes: sign * (hours * 60 + minutes),
      sourceTz: 'numeric',
    };
  }

  // Per RFC 5322, unknown alphabetic timezones should be treated as "-0000" (UTC)
  if (/^[A-Za-z]+$/u.test(tz)) {
    return { offsetMinutes: 0, sourceTz: 'obs-name' };
  }

  throw new RangeError(`Unrecognized timezone: ${tz}.`);
}

/**
 * Check if a timezone name is obsolete and should not be generated.
 *
 * @param tz Timezone string
 * @returns True if timezone is obsolete
 */
export function isObsoleteTimezone(tz: string): boolean {
  return tz.toLowerCase() in OBSOLETE_TIMEZONE_MAP;
}

/**
 * Get list of all obsolete timezone names for validation.
 *
 * @returns Array of obsolete timezone names
 */
export function getObsoleteTimezoneNames(): string[] {
  return Object.keys(OBSOLETE_TIMEZONE_MAP);
}
