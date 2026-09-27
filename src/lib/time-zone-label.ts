/** Friendly display only; keep the IANA identifier for scheduling. */
const NAMES: Record<string, string> = {
  "America/New_York": "Eastern Time (New York)", "America/Chicago": "Central Time (Chicago)",
  "America/Denver": "Mountain Time (Denver)", "America/Los_Angeles": "Pacific Time (Los Angeles)",
  "America/Toronto": "Eastern Time (Toronto)", "Europe/London": "UK time (London)",
  "Europe/Dublin": "Ireland time (Dublin)", "Europe/Amsterdam": "Central European Time (Amsterdam)",
  "Europe/Berlin": "Central European Time (Berlin)", "Europe/Paris": "Central European Time (Paris)",
  "Asia/Dubai": "UAE – Dubai", "Asia/Riyadh": "Saudi Arabia – Riyadh", "Asia/Qatar": "Qatar – Doha",
  "Asia/Karachi": "Pakistan – Islamabad/Karachi", "Asia/Singapore": "Singapore", "Australia/Sydney": "Australia – Sydney",
  "Asia/Kuwait": "Kuwait City", "Asia/Kolkata": "India – Kolkata", "UTC": "Coordinated Universal Time",
};

export const COMMON_ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto",
  "Europe/London", "Europe/Dublin", "Europe/Amsterdam", "Europe/Berlin", "Europe/Paris",
  "Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Karachi", "Asia/Singapore", "Australia/Sydney",
];

export function friendlyTimeZone(tz: string): string {
  if (NAMES[tz]) return NAMES[tz];
  const parts = tz.split("/");
  const city = (parts[parts.length - 1] ?? tz).replace(/_/g, " ");
  const region = parts.length > 1 ? parts[0]!.replace(/_/g, " ") : "";
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "long" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    if (name && !name.startsWith("GMT") && name !== city) return `${name} (${city})`;
  } catch { /* fall through */ }
  return region ? `${city} (${region})` : city;
}

/** Clean city-based zones: common first, then all others alphabetically by friendly name. */
export function timeZoneOptions(current?: string): { value: string; label: string }[] {
  const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
  const all = (fn ? fn("timeZone") : []).filter((z) => z.includes("/") && !/^(Etc|SystemV|US|Canada|Brazil|Mexico|Chile)\//.test(z));
  if (current && !all.includes(current) && !COMMON_ZONES.includes(current)) all.push(current);
  const alias: Record<string, string> = { "Asia/Calcutta": "Asia/Kolkata" };
  const rest = all.filter((z) => !COMMON_ZONES.includes(z) && !alias[z])
    .map((value) => ({ value, label: friendlyTimeZone(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [...COMMON_ZONES.map((value) => ({ value, label: friendlyTimeZone(value) })), ...rest];
}

export function clientTimeZone(tz: string) {
  return tz === "Asia/Karachi" ? "Pakistan – Islamabad/Karachi" : (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}
