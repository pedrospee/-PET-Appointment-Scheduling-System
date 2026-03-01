import { compareTime, normalizeTime, normalizeISODate } from "../../libs/dayjs.js";
import { fetchAppointmentsByDate } from "../../services/schedule-fetch.js";

/**
 In-memory state cache keyed by date (YYYY-MM-DD).
 This supports fast conflict checks and optimistic UI flows.
 */
const stateByDate = new Map();

/**
 Sanitizes API data into the shape expected by the UI.
 Returns null for invalid records to prevent rendering inconsistent data.
 */
function sanitizeAppointment(a) {
  if (!a || typeof a !== "object") return null;
  if (!a.id || !a.date || !a.time) return null;

  const id = String(a.id || "").trim();
  const date = normalizeISODate(String(a.date));
  const time = normalizeTime(String(a.time || ""));

  if (!id || !date || !time) return null;

  return {
    id,
    tutor: String(a.tutor || ""),
    pet: String(a.pet || ""),
    phone: String(a.phone || ""),
    service: String(a.service || ""),
    date,
    time,
  };
}

export function getStateForDate(dateISO) {
  return stateByDate.get(dateISO) || [];
}

/**
 Adds/merges an appointment into state for a given date.
 We dedupe by id and keep state sorted by time for stable rendering.
 */
export function addToState(dateISO, appointment) {
  const current = getStateForDate(dateISO);

  const next = [...current, appointment]
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .sort((a, b) => compareTime(a.time, b.time));

  stateByDate.set(dateISO, next);
  return next;
}

/**
 Returns true if the given date already has an appointment at the given time.
 Used for conflict prevention before submitting.
 */
export function hasConflict(dateISO, timeHHmm) {
  return getStateForDate(dateISO).some((a) => a.time === timeHHmm);
}

/**
 Replaces the state for a date.
 This is mainly used to rollback optimistic operations (e.g. delete).
 */
export function setStateForDate(dateISO, appointments) {
  const next = Array.isArray(appointments) ? appointments : [];
  stateByDate.set(dateISO, next);
  return next;
}

/**
 Removes an appointment from state by id.
 Used by optimistic delete flows.
 */
export function removeFromState(dateISO, id) {
  const current = getStateForDate(dateISO);
  const next = current.filter((a) => a.id !== id);
  stateByDate.set(dateISO, next);
  return next;
}

/**
 Loads appointments for a given date from the API and updates local state.
 We do not re-filter by date here because the API query already does that.
 */
export async function loadScheduleForDate(dateISO) {
  const raw = await fetchAppointmentsByDate(dateISO);

  const cleaned = Array.isArray(raw)
    ? raw.map(sanitizeAppointment).filter(Boolean)
    : [];

  const deduped = cleaned
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .sort((a, b) => compareTime(a.time, b.time));

  stateByDate.set(dateISO, deduped);
  return deduped;
}