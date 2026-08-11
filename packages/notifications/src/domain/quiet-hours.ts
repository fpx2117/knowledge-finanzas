function getLocalParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute };
}

function toHHmm(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// `start`/`end` are "HH:mm" in the user's local timezone. Supports windows that wrap midnight
// (e.g. "22:00"-"07:00"). A zero-width window (start === end) never blocks anything.
export function isWithinQuietHours(now: Date, timezone: string, start: string, end: string): boolean {
  if (start === end) return false;
  const { hour, minute } = getLocalParts(now, timezone);
  const current = toHHmm(hour, minute);
  return start < end ? current >= start && current < end : current >= start || current < end;
}

// Next UTC instant at/after `now` whose local wall-clock time in `timezone` equals `targetHHmm`.
// Reconverges the same way packages/finance's local-midnight helper does, so it stays correct
// across a DST transition landing between `now` and the target time.
export function nextLocalTimeAtOrAfter(now: Date, timezone: string, targetHHmm: string): Date {
  const [targetHour, targetMinute] = targetHHmm.split(":").map(Number);
  const local = getLocalParts(now, timezone);
  const isPast = local.hour > targetHour || (local.hour === targetHour && local.minute >= targetMinute);
  let timestamp = Date.UTC(local.year, local.month - 1, local.day, targetHour, targetMinute) + (isPast ? 24 * 60 * 60 * 1000 : 0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getLocalParts(new Date(timestamp), timezone);
    const observedMinutes = actual.hour * 60 + actual.minute;
    const targetMinutes = targetHour * 60 + targetMinute;
    let diffMinutes = targetMinutes - observedMinutes;
    if (diffMinutes > 12 * 60) diffMinutes -= 24 * 60;
    if (diffMinutes < -12 * 60) diffMinutes += 24 * 60;
    timestamp += diffMinutes * 60 * 1000;
  }

  return new Date(timestamp);
}
