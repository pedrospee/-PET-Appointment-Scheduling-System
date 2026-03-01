import { deleteAppointment } from "../../services/schedule-cancel.js";
import { getStateForDate, setStateForDate, removeFromState } from "./load.js";
import { renderSchedule } from "./show.js";

function setAlert(message) {
  const el = document.querySelector("#appAlerts");
  if (el) el.textContent = message || "";
}

/**
 Sets up delegated click handling for appointment deletion.

 Strategy:
 - Optimistic UI: remove from DOM immediately
 - Persist: send DELETE request
 - Rollback: restore state and re-render if API fails
 */
export function setupCancelHandlers() {
  document.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.('button[data-action="delete"], .appointment__delete');
    if (!btn) return;

    const item = btn.closest(".appointment,[data-id]");
    if (!item) return;

    const id = item.dataset.id;
    const dateISO = item.dataset.date;

    if (!id || !dateISO) return;

    // Snapshot state for rollback.
    const before = getStateForDate(dateISO);

    // Optimistic removal: update DOM and local state immediately.
    item.remove();
    removeFromState(dateISO, id);

    try {
      await deleteAppointment(id);
      setAlert("Agendamento removido.");
    } catch (err) {
      // Rollback: restore state and rebuild the UI for that date.
      setStateForDate(dateISO, before);
      renderSchedule(before);

      setAlert(err?.message || "Não foi possível remover o agendamento. Tente novamente.");
    }
  });
}