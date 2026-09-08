/**
 * IANA time zone names for the company profile.
 *
 * The full list comes from the browser when it supports `Intl.supportedValuesOf`;
 * the fallback covers the zones this product actually ships into so the field is
 * never empty on an older engine.
 */
const FALLBACK_TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Zurich',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Australia/Sydney', 'UTC',
];

/** Offered first, because they cover the overwhelming majority of installations. */
export const COMMON_TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Los_Angeles', 'UTC',
];

export function allTimezones(): string[] {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  try {
    const zones = supported?.('timeZone');
    if (zones?.length) return zones;
  } catch {
    // Fall through to the shipped list.
  }
  return FALLBACK_TIMEZONES;
}

/** "Asia/Kolkata" → "Asia / Kolkata (GMT+05:30)" for a readable option label. */
export function describeTimezone(zone: string): string {
  const readable = zone.replace(/_/g, ' ').replace('/', ' / ');
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value;
    return offset ? `${readable} (${offset})` : readable;
  } catch {
    return readable;
  }
}
