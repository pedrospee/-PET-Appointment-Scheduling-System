import { createAppointment } from "../services/schedule-new.js";
import { toISODate, dayjs } from "../libs/dayjs.js";

import { loadScheduleForDate } from "./schedules/load.js";
import { renderSchedule } from "./schedules/show.js";
import { setupCancelHandlers } from "./schedules/cancel.js";

import { setupFormSubmit } from "./form/submit.js";
import { setupDateChange } from "./form/date-change.js";
import { setupHourValidation } from "./form/hours-load.js";
import { setupHoursClick } from "./form/hours-click.js";
import { setupPhoneMask } from "./form/phone-mask.js";

/**
 Centralized DOM selectors.
 Keeps query logic consistent and easier to maintain.
 */
const SELECTORS = {
  agendaDate: "#agendaDate",
  btnNew: "#newAppointmentBtn",
  alerts: "#appAlerts",
  modal: "#appointmentModal",
  modalOverlay: "#modalOverlay",
  btnCancel: "#btnCancelModal",
  form: "#appointmentForm",
  modalDate: "#date",
};

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 Default demo data used to seed the current day
 if no appointments exist yet.
 This improves first-load UX.
 */
const DEMO_APPOINTMENTS = [
  { tutor: "Mariana", pet: "Luna", phone: "(11)9 9999-9999", service: "Banho e Tosa", time: "09:30" },
  { tutor: "João", pet: "Thor", phone: "(11)9 8888-8888", service: "Consulta Veterinária", time: "10:15" },
  { tutor: "Ana", pet: "Bella", phone: "(11)9 7777-7777", service: "Banho e Tosa", time: "14:00" },
  { tutor: "Lucas", pet: "Max", phone: "(11)9 5555-7777", service: "Adestramento", time: "19:30" },
];

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function setAlert(message) {
  const el = qs(SELECTORS.alerts);
  if (el) el.textContent = message || "";
}

/**
 Controls modal open/close behavior,
 focus trapping and accessibility attributes.
 */
function createModalController() {
  const modal = qs(SELECTORS.modal);
  const overlay = qs(SELECTORS.modalOverlay);
  const btnCancel = qs(SELECTORS.btnCancel);
  const form = qs(SELECTORS.form);

  let lastActiveEl = null;

  function getFocusable() {
    if (!modal) return [];
    return Array.from(modal.querySelectorAll(FOCUSABLE))
      .filter((el) => !el.hasAttribute("disabled"));
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;

    const items = getFocusable();
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    trapFocus(e);
  }

  function open() {
    if (!modal) return;

    lastActiveEl = document.activeElement;

    modal.classList.add("is-open");
    document.body.classList.add("is-scroll-locked");
    modal.setAttribute("aria-hidden", "false");

    const agendaDate = qs(SELECTORS.agendaDate);
    const dateInput = qs(SELECTORS.modalDate);
    const todayISO = toISODate(dayjs());

    // Prevent scheduling in past dates inside modal
    if (dateInput) {
      dateInput.min = todayISO;

      // Sync modal date with currently selected agenda date
      if (!dateInput.value && agendaDate?.value) {
        dateInput.value = agendaDate.value;
      }
    }

    const firstField = form?.querySelector("input, select, textarea") || modal;

    queueMicrotask(() => {
      modal.focus?.();
      firstField?.focus?.();
    });

    document.addEventListener("keydown", onKeydown);
    setAlert("");
  }

  function close() {
    if (!modal) return;

    modal.classList.remove("is-open");
    document.body.classList.remove("is-scroll-locked");
    modal.setAttribute("aria-hidden", "true");

    document.removeEventListener("keydown", onKeydown);
    lastActiveEl?.focus?.();
  }

  if (overlay && overlay.dataset.bound !== "true") {
    overlay.dataset.bound = "true";
    overlay.addEventListener("click", close);
  }

  if (btnCancel && btnCancel.dataset.bound !== "true") {
    btnCancel.dataset.bound = "true";
    btnCancel.addEventListener("click", close);
  }

  return { open, close };
}

/**
 Seeds demo appointments once per day.
 Uses localStorage to avoid duplicate seeds.
 */
async function seedTodayIfEmpty(todayISO, currentAppointments) {
  const seedKey = `agenda_seeded_${todayISO}`;
  const lockKey = `agenda_seed_lock_${todayISO}`;

  if (currentAppointments.length > 0) return false;
  if (localStorage.getItem(seedKey) === "true") return false;
  if (localStorage.getItem(lockKey) === "true") return false;

  localStorage.setItem(lockKey, "true");

  try {
    for (const item of DEMO_APPOINTMENTS) {
      await createAppointment({ ...item, date: todayISO });
    }
    localStorage.setItem(seedKey, "true");
    return true;
  } finally {
    localStorage.removeItem(lockKey);
  }
}

/**
 Main application bootstrap.
 Initializes date, loads schedule,
 seeds demo data if needed,
 and registers all feature modules.
 */
export async function bootstrap() {
  if (document.body.dataset.appBooted === "true") return;
  document.body.dataset.appBooted = "true";

  const agendaDate = qs(SELECTORS.agendaDate);
  const btnNew = qs(SELECTORS.btnNew);
  const modal = createModalController();

  const todayISO = toISODate(dayjs());
  if (agendaDate) agendaDate.value = todayISO;

  let appointments = [];

  try {
    appointments = await loadScheduleForDate(todayISO);
    renderSchedule(appointments);
  } catch (err) {
    setAlert(err?.message || "Failed to load initial schedule.");
    renderSchedule([]);
    return;
  }

  try {
    const didSeed = await seedTodayIfEmpty(todayISO, appointments);
    if (didSeed) {
      appointments = await loadScheduleForDate(todayISO);
      renderSchedule(appointments);
      setAlert("Initial schedule loaded.");
    }
  } catch (err) {
    setAlert(err?.message || "Failed to create demo appointments.");
  }

  setupCancelHandlers();
  setupFormSubmit(modal);
  setupDateChange();
  setupHourValidation();
  setupHoursClick();
  setupPhoneMask();

  if (btnNew && btnNew.dataset.bound !== "true") {
    btnNew.dataset.bound = "true";
    btnNew.addEventListener("click", modal.open);
  }
}