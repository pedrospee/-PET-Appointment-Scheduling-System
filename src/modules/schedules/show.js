import { getPeriodByTime } from "../../libs/dayjs.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 Returns the correct <ul> list element for a given period.
 We prefer stable IDs, but keep a fallback based on DOM order.
 */
export function getListElementByPeriod(period) {
  const byId = {
    morning: qs("#list-morning"),
    afternoon: qs("#list-afternoon"),
    night: qs("#list-night"),
  }[period];

  if (byId) return byId;

  // Fallback: rely on DOM order (morning / afternoon / night).
  const lists = qsa(".period__list");
  if (lists.length >= 3) {
    return { morning: lists[0], afternoon: lists[1], night: lists[2] }[period] || null;
  }

  return null;
}

/**
 Builds a single appointment list item using safe DOM APIs.
 Avoids innerHTML to protect against user-provided content issues.
 */
export function renderAppointmentItem(appointment) {
  const li = document.createElement("li");
  li.className = "appointment";
  li.dataset.id = appointment.id;
  li.dataset.date = appointment.date;
  li.dataset.time = appointment.time;

  const time = document.createElement("span");
  time.className = "appointment__time";
  time.textContent = appointment.time;

  const info = document.createElement("div");
  info.className = "appointment__info";

  const pet = document.createElement("strong");
  pet.textContent = appointment.pet;

  const meta = document.createElement("span");
  meta.textContent = `${appointment.tutor} / ${appointment.service}`;

  info.append(pet, meta);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "appointment__delete";
  btn.dataset.action = "delete";
  btn.setAttribute(
    "aria-label",
    `Remover agendamento de ${appointment.pet} às ${appointment.time}`
  );
  btn.textContent = "Remover";

  li.append(time, info, btn);
  return li;
}

/**
 Full render: clears all lists and re-renders from scratch.
 This keeps the UI deterministic and prevents DOM drift.
 */
export function renderSchedule(appointments) {
  const morning = getListElementByPeriod("morning");
  const afternoon = getListElementByPeriod("afternoon");
  const night = getListElementByPeriod("night");

  for (const ul of [morning, afternoon, night]) {
    if (ul) ul.textContent = "";
  }

  for (const a of appointments) {
    const period = getPeriodByTime(a.time);
    if (!period) continue;

    const ul = getListElementByPeriod(period);
    if (!ul) continue;

    ul.appendChild(renderAppointmentItem(a));
  }
}

/**
 Incremental insert used after creating a new appointment.
 Keeps the period list sorted by time without re-rendering everything.
 */
export function insertAppointmentOrdered(appointment) {
  const period = getPeriodByTime(appointment.time);
  if (!period) return false;

  const ul = getListElementByPeriod(period);
  if (!ul) return false;

  const node = renderAppointmentItem(appointment);
  const children = Array.from(ul.children);

  const idx = children.findIndex((li) => (li.dataset.time || "") > appointment.time);

  if (idx === -1) ul.appendChild(node);
  else ul.insertBefore(node, children[idx]);

  return true;
}