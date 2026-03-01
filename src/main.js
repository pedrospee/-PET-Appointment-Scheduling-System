import "./libs/dayjs.js";

import "./styles/global.css";
import "./styles/form.css";
import "./styles/schedule.css";

import { bootstrap } from "./modules/page-load.js";

/**
 Starts the application safely.
 Ensures the DOM is ready before executing bootstrap logic.
 Prevents runtime errors caused by missing DOM nodes.
 */
function start() {
  try {
    bootstrap();
  } catch (err) {
    console.error("[Agenda&PET] Bootstrap failed:", err);

    const alerts = document.querySelector("#appAlerts");
    if (alerts) {
      alerts.textContent =
        err?.message || "Application failed to initialize.";
    }
  }
}

/**
 Execute bootstrap only after DOM is fully parsed.
 This avoids timing issues in development and HMR scenarios.
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}