import { apiFetch } from "./api-config.js";

/**
 Deletes an appointment by id.
 Wraps API call to keep UI layer clean.
 */
export async function deleteAppointment(id) {
  if (!id) {
    throw new Error("ID inválido para exclusão.");
  }

  await apiFetch(`/appointments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return true;
}