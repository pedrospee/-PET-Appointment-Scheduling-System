import {
  dayjs,
  toISODate,
  normalizeTime,
  getPeriodByTime,
  isTimeInRange,
} from "../../libs/dayjs.js";

import { createAppointment } from "../../services/schedule-new.js";
import { addToState, getStateForDate, hasConflict } from "../schedules/load.js";
import { insertAppointmentOrdered, renderSchedule } from "../schedules/show.js";

/**
 Displays a global message in the aria-live region.
 Used for success and error feedback.
 */
function setAlert(message) {
  const el = document.querySelector("#appAlerts");
  if (el) el.textContent = message || "";
}

/**
 Returns the <small> element responsible for a given field error.
 */
function getErrorEl(fieldId) {
  return document.querySelector(
    `.field-error[data-error-for="${fieldId}"]`
  );
}

/**
 Sets or clears validation error for a specific field.
 Keeps ARIA attributes aligned for accessibility.
 */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const err = getErrorEl(fieldId);

  if (err) {
    const errId = `${fieldId}-error`;
    err.id = errId;
    err.textContent = message || "";

    if (input) {
      if (message) input.setAttribute("aria-describedby", errId);
      else input.removeAttribute("aria-describedby");
    }
  }

  if (input) {
    if (message) input.classList.add("is-invalid");
    else input.classList.remove("is-invalid");

    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

// Clears all field-level errors.
function clearAllErrors() {
  ["tutor", "pet", "phone", "service", "date", "time"]
    .forEach((f) => setFieldError(f, ""));
}


// Validates that the selected time falls within allowed business windows.
function validateTimeWindow(timeHHmm) {
  if (isTimeInRange(timeHHmm, "09:00", "12:00")) return null;
  if (isTimeInRange(timeHHmm, "13:00", "18:00")) return null;
  if (isTimeInRange(timeHHmm, "19:00", "22:00")) return null;

  return "Horário fora das faixas válidas (09–12, 13–18, 19–22).";
}


// Rounds current time to the next 15-minute boundary.
function roundUpToStepMinutes(d, stepMin) {
  const m = d.minute();
  const rest = m % stepMin;
  if (rest === 0) return d.second(0);
  return d.add(stepMin - rest, "minute").second(0);
}

/**
 Prevents scheduling in the past.
 Applies both date and time validation.
 */
function validateNotPast(values, timeHHmm) {
  const todayISO = toISODate(dayjs());

  if (values.date && values.date < todayISO) {
    return { field: "date", msg: "Não é possível agendar em datas passadas." };
  }

  if (values.date === todayISO && timeHHmm) {
    const now = roundUpToStepMinutes(dayjs(), 15).format("HH:mm");

    if (timeHHmm < now) {
      return {
        field: "time",
        msg: `Horário já passou. Selecione a partir de ${now}.`,
      };
    }
  }

  return null;
}

/**
 Core form validation logic.
 Returns validation result and normalized time.
 */
function validateForm(values) {
  let ok = true;

  const phoneDigits = values.phone.replace(/\D/g, "");
  if (phoneDigits.length !== 11) {
    setFieldError("phone", "Informe um telefone válido com 11 dígitos.");
    ok = false;
  }

  const required = [
    ["tutor", "Informe o nome do tutor."],
    ["pet", "Informe o nome do pet."],
    ["phone", "Informe um telefone para contato."],
    ["service", "Informe o serviço."],
    ["date", "Selecione a data do agendamento."],
    ["time", "Selecione o horário."],
  ];

  for (const [field, msg] of required) {
    if (!values[field] || !String(values[field]).trim()) {
      setFieldError(field, msg);
      ok = false;
    }
  }

  const timeHHmm = normalizeTime(values.time || "");
  if (values.time && !timeHHmm) {
    setFieldError("time", "Horário inválido. Use o formato HH:mm.");
    ok = false;
  }

  if (timeHHmm) {
    const winMsg = validateTimeWindow(timeHHmm);
    if (winMsg) {
      setFieldError("time", winMsg);
      ok = false;
    }

    if (!getPeriodByTime(timeHHmm)) {
      setFieldError("time", "Horário fora dos períodos disponíveis.");
      ok = false;
    }
  }

  if (values.date && timeHHmm) {
    const past = validateNotPast(values, timeHHmm);
    if (past) {
      setFieldError(past.field, past.msg);
      ok = false;
    }
  }

  if (values.date && timeHHmm) {
    if (hasConflict(values.date, timeHHmm)) {
      setFieldError(
        "time",
        "Conflito: já existe um agendamento nesse horário para essa data."
      );
      ok = false;
    }
  }

  return { ok, timeHHmm };
}

export function setupFormSubmit(modalController) {
  const form = document.querySelector("#appointmentForm");
  const agendaDate = document.querySelector("#agendaDate");
  if (!form) return;

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  let inFlight = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (inFlight) return;

    inFlight = true;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    clearAllErrors();
    setAlert("");

    const values = {
      tutor: document.querySelector("#tutor")?.value ?? "",
      pet: document.querySelector("#pet")?.value ?? "",
      phone: document.querySelector("#phone")?.value ?? "",
      service: document.querySelector("#service")?.value ?? "",
      date: document.querySelector("#date")?.value ?? "",
      time: document.querySelector("#time")?.value ?? "",
    };

    const { ok, timeHHmm } = validateForm(values);

    if (!ok) {
      inFlight = false;
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const current = getStateForDate(values.date);
    if (current.some((a) => a.time === timeHHmm)) {
      setFieldError(
        "time",
        "Horário indisponível: já existe um agendamento nesse horário."
      );
      inFlight = false;
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      const created = await createAppointment({
        ...values,
        time: timeHHmm,
      });

      const nextState = addToState(values.date, created);

      if (agendaDate?.value === values.date) {
        const inserted = insertAppointmentOrdered(created);
        if (!inserted) renderSchedule(nextState);
      } else {
        agendaDate.value = values.date;
        agendaDate.dispatchEvent(new Event("change", { bubbles: true }));
      }

      form.reset();
      modalController?.close?.();
      setAlert("Agendamento criado com sucesso.");
    } catch (err) {
      setAlert(
        err?.message ||
          "Não foi possível criar o agendamento. Tente novamente."
      );
    } finally {
      inFlight = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}