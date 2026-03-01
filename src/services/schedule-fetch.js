import { apiFetch } from "./api-config.js";
import { normalizeISODate } from "../libs/dayjs.js";

/**
 Loads appointments for a given day, already sorted by time.
 The API performs date filtering; the UI relies on this for correctness.
 */
export async function fetchAppointmentsByDate(dateISO) {
  const iso = normalizeISODate(dateISO);
  if (!iso) return [];

  const qs = new URLSearchParams({
    date: iso,
    _sort: "time",
  });

  return apiFetch(`/appointments?${qs.toString()}`);
}