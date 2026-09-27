/** Friendly display only; keep the IANA identifier for scheduling. */
export function friendlyTimeZone(tz: string): string {
  const names: Record<string, string> = {
    "America/New_York": "Eastern Time (New York)", "America/Chicago": "Central Time (Chicago)",
    "America/Denver": "Mountain Time (Denver)", "America/Los_Angeles": "Pacific Time (Los Angeles)",
    "Europe/London": "UK time (London)", "Europe/Paris": "Central European Time (Paris)",
    "Asia/Karachi": "Pakistan – Karachi", "Asia/Dubai": "UAE – Dubai",
    "Asia/Riyadh": "Saudi Arabia – Riyadh", "Asia/Qatar": "Qatar – Doha",
    "Asia/Kuwait": "Kuwait City", "Asia/Kolkata": "India – Kolkata",
    "UTC": "Coordinated Universal Time",
  };
  if (names[tz]) return names[tz];
  const city = (tz.split("/").pop() ?? tz).replace(/_/g, " ");
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "long" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    return name && name !== city ? `${name} (${city})` : city;
  } catch { return city; }
}

export function clientTimeZone(tz: string) {
  return tz === "Asia/Karachi" ? "Pakistan – Karachi" : (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}