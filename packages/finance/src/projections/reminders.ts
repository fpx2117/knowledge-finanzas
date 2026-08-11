export type ReminderPreset = "DUE_DATE" | "BEFORE_1_DAY" | "BEFORE_3_DAYS" | "BEFORE_7_DAYS" | "CUSTOM";
export function reminderDedupKey(sourceType: "DEBT_INSTALLMENT" | "SCHEDULED_TRANSACTION", sourceId: string, preset: ReminderPreset, customSchedule = "-") { return `v1:${sourceType}:${sourceId}:${preset}:${customSchedule}`; }
export function resolveReminderAt(localDate: string, localTime: string, timezone: string) {
  const [year, month, day] = localDate.split("-").map(Number); const [hour, minute] = localTime.split(":").map(Number); let timestamp = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let index = 0; index < 3; index += 1) { const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])); const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute); const expected = Date.UTC(year, month - 1, day, hour, minute); timestamp += expected - observed; }
  return new Date(timestamp);
}
