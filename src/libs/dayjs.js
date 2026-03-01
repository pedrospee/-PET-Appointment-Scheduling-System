import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";


// Enables strict parsing using custom formats.
dayjs.extend(customParseFormat);


// Converts any valid date input into ISO format (YYYY-MM-DD).
export function toISODate(input) {
  const d = dayjs(input);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

/**
 * Normalizes ISO-like strings.
 * Accepts both padded and non-padded forms.
 */
export function normalizeISODate(value) {
  if (typeof value !== "string") return "";

  const d = dayjs(value.trim(), ["YYYY-MM-DD", "YYYY-M-D"], true);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
}


// Normalizes time strings into HH:mm format.
export function normalizeTime(value) {
  if (typeof value !== "string") return "";

  const d = dayjs(
    `2000-01-01 ${value.trim()}`,
    ["YYYY-MM-DD HH:mm", "YYYY-MM-DD H:mm"],
    true
  );

  return d.isValid() ? d.format("HH:mm") : "";
}


// Compares two times (HH:mm).
export function compareTime(a, b) {
  const ta = normalizeTime(a);
  const tb = normalizeTime(b);

  if (!ta || !tb) return 0;
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}


// Checks if time is inside inclusive range.
export function isTimeInRange(time, start, end) {
  const t = normalizeTime(time);
  const s = normalizeTime(start);
  const e = normalizeTime(end);

  if (!t || !s || !e) return false;
  return t >= s && t <= e;
}


// Maps time into scheduling period.
export function getPeriodByTime(time) {
  const t = normalizeTime(time);
  if (!t) return null;

  if (isTimeInRange(t, "09:00", "12:00")) return "morning";
  if (isTimeInRange(t, "13:00", "18:00")) return "afternoon";
  if (isTimeInRange(t, "19:00", "22:00")) return "night";

  return null;
}

export { dayjs };