import {
  dayjs,
  toISODate,
  normalizeTime,
  getPeriodByTime,
  isTimeInRange,
} from "../../libs/dayjs.js";
import { loadScheduleForDate, hasConflict } from "../schedules/load.js";

/**
 Returns the error element associated with a given field id.
 The HTML uses: <small class="field-error" data-error-for="fieldId">...</small>
 */
function getErrorEl(fieldId) {
  return document.querySelector(`.field-error[data-error-for="${fieldId}"]`);
}

/**
 Sets an accessible, per-field error message and toggles invalid styles.
 This intentionally does not throw; it keeps UX smooth and predictable.
 */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const err = getErrorEl(fieldId);

  if (err) err.textContent = message || "";

  if (input) {
    if (message) input.classList.add("is-invalid");
    else input.classList.remove("is-invalid");

    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

function clearFieldError(fieldId) {
  setFieldError(fieldId, "");
}

/**
 Checks whether a time is within any allowed scheduling window.
 We keep the business rules centralized here to avoid duplication across modules.
 */
function validateWindow(timeHHmm) {
  if (isTimeInRange(timeHHmm, "09:00", "12:00")) return null;
  if (isTimeInRange(timeHHmm, "13:00", "18:00")) return null;
  if (isTimeInRange(timeHHmm, "19:00", "22:00")) return null;

  return "Horário fora das faixas válidas (09–12, 13–18, 19–22).";
}

/**
 Rounds "now" up to the next step boundary (e.g. 15-minute grid).
 This prevents cases where "now" is between steps, but the UI uses stepped input.
 */
function roundUpToStepMinutes(d, stepMin) {
  const m = d.minute();
  const rest = m % stepMin;
  if (rest === 0) return d.second(0);
  return d.add(stepMin - rest, "minute").second(0);
}

export function setupHourValidation() {
  const dateInput = document.querySelector("#date");
  const timeInput = document.querySelector("#time");

  if (!dateInput || !timeInput) return;

  /**
   HTML time input cannot disable arbitrary values.
   We restrict the general UX with step/min and enforce rules via validation.
   */
  const STEP_MIN = 15;
  timeInput.setAttribute("step", String(STEP_MIN * 60)); // seconds
  timeInput.setAttribute("inputmode", "numeric");

  // Defense-in-depth: prevent selecting past dates via input constraints.
  const todayISO = toISODate(dayjs());
  dateInput.min = todayISO;

  /**
   Token used to avoid race conditions when loading schedules for different dates.
   We only apply the latest async result.
   */
  let loadToken = 0;

  async function ensureStateForSelectedDate() {
    const dateISO = dateInput.value;
    if (!dateISO) return;

    const token = ++loadToken;

    try {
      // We load appointments for the selected date to validate conflicts locally.
      // Rendering is handled elsewhere; this is state preparation only.
      await loadScheduleForDate(dateISO);
    } catch {
      // If this fails, conflict checks become best-effort. Submit still acts as the final gate.
    } finally {
      if (token !== loadToken) return;
    }
  }

  function validateDateNotPast() {
    const dateISO = dateInput.value;

    if (!dateISO) {
      setFieldError("date", "Selecione a data do agendamento.");
      return false;
    }

    if (dateISO < todayISO) {
      setFieldError("date", "Não é possível agendar em datas passadas.");
      return false;
    }

    clearFieldError("date");
    return true;
  }

  /**
   Prevents scheduling in the past when the selected date is today.
   We round up to the next step boundary to match the input step.
   */
  function validateTimeNotPast(timeHHmm) {
    const dateISO = dateInput.value;
    if (!dateISO) return null;
    if (dateISO !== todayISO) return null;

    const now = roundUpToStepMinutes(dayjs(), STEP_MIN);
    const nowHHmm = now.format("HH:mm");

    if (timeHHmm < nowHHmm) {
      return `Horário já passou. Selecione um horário a partir de ${nowHHmm}.`;
    }

    return null;
  }

  async function runTimeValidation() {
    if (!validateDateNotPast()) return;

    const raw = timeInput.value || "";
    if (!raw.trim()) {
      clearFieldError("time");
      return;
    }

    const hhmm = normalizeTime(raw);
    if (!hhmm) {
      setFieldError("time", "Horário inválido. Use o formato HH:mm.");
      return;
    }

    // Business rule: allowed scheduling windows.
    const windowMsg = validateWindow(hhmm);
    if (windowMsg) {
      setFieldError("time", windowMsg);
      return;
    }

    // Defensive check: make sure it maps to a known period.
    if (!getPeriodByTime(hhmm)) {
      setFieldError("time", "Horário fora dos períodos disponíveis.");
      return;
    }

    // Business rule: no past times when scheduling for today.
    const pastMsg = validateTimeNotPast(hhmm);
    if (pastMsg) {
      setFieldError("time", pastMsg);
      return;
    }

    // Ensure local state is aligned with the date being validated.
    await ensureStateForSelectedDate();

    // Business rule: prevent conflicts (same date + same time).
    if (hasConflict(dateInput.value, hhmm)) {
      setFieldError("time", "Horário indisponível: já existe um agendamento nesse horário.");
      return;
    }

    clearFieldError("time");
  }

  /**
   When the date changes:
   - validate it
   - adjust time min for today's date
   - refresh state cache for conflict checks
   - re-validate time if user already typed it
   */
  dateInput.addEventListener("change", async () => {
    validateDateNotPast();

    if (dateInput.value === todayISO) {
      const now = roundUpToStepMinutes(dayjs(), STEP_MIN).format("HH:mm");
      timeInput.min = now;
    } else {
      timeInput.removeAttribute("min");
    }

    await ensureStateForSelectedDate();
    await runTimeValidation();
  });

  // Validate on multiple events to cover typical user flows.
  timeInput.addEventListener("change", runTimeValidation);
  timeInput.addEventListener("blur", runTimeValidation);

  // Provide early feedback while typing, without waiting for blur.
  timeInput.addEventListener("input", () => {
    runTimeValidation();
  });
}