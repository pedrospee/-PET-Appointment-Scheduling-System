import { loadScheduleForDate } from "../schedules/load.js";
import { renderSchedule } from "../schedules/show.js";

/**
 Simple alert output for user-facing status messages.
 This keeps UI feedback consistent without introducing modal/toast dependencies.
 */
function setAlert(message) {
  const el = document.querySelector("#appAlerts");
  if (el) el.textContent = message || "";
}

export function setupDateChange() {
  const agendaDate = document.querySelector("#agendaDate");
  if (!agendaDate) return;

  /**
   Request token prevents race conditions:
   if the user changes the date quickly, older responses should not overwrite newer renders.
   */
  let requestToken = 0;

  async function loadAndRender(dateISO) {
    const token = ++requestToken;

    setAlert("Carregando agenda...");

    try {
      const appointments = await loadScheduleForDate(dateISO);

      // Only render if this is still the latest request and the input hasn't changed.
      if (token !== requestToken) return;
      if (agendaDate.value !== dateISO) return;

      renderSchedule(appointments);
      setAlert("");
    } catch (err) {
      if (token !== requestToken) return;

      setAlert(err?.message || "Falha ao carregar agenda da data selecionada.");

      // Clear UI to avoid showing stale data from a previous date.
      renderSchedule([]);
    }
  }

  /**
   "input" provides faster feedback in some browsers.
   "change" remains the standard event to cover all environments.
   */
  agendaDate.addEventListener("input", () => {
    const dateISO = agendaDate.value;
    if (dateISO) loadAndRender(dateISO);
  });

  agendaDate.addEventListener("change", () => {
    const dateISO = agendaDate.value;
    if (dateISO) loadAndRender(dateISO);
  });
}