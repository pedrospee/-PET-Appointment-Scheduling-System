import { nanoid } from "nanoid";
import { normalizeISODate, normalizeTime } from "../libs/dayjs.js";
import { apiFetch } from "./api-config.js";

/**
 Validates the minimum payload shape expected by the API.
 This keeps the service strict and predictable.
 */
function assertPayloadShape(payload) {
  const required = ["tutor", "pet", "phone", "service", "date", "time"];

  for (const k of required) {
    if (!payload || typeof payload[k] !== "string" || !payload[k].trim()) {
      throw new Error(`Campo obrigatório ausente: ${k}`);
    }
  }
}

/**
 Creates a new appointment (POST /appointments).

 Responsibilities:
 - Validate required fields
 - Normalize date/time formats
 - Generate a client-side id (nanoid), compatible with json-server
 */
export async function createAppointment(payload) {
  assertPayloadShape(payload);

  const dateISO = normalizeISODate(payload.date);
  const timeHHmm = normalizeTime(payload.time);

  if (!dateISO) throw new Error("Data inválida.");
  if (!timeHHmm) throw new Error("Horário inválido.");

  const appointment = {
    id: nanoid(),
    tutor: payload.tutor.trim(),
    pet: payload.pet.trim(),
    phone: payload.phone.trim(),
    service: payload.service.trim(),
    date: dateISO,
    time: timeHHmm,
  };

  const created = await apiFetch("/appointments", {
    method: "POST",
    body: JSON.stringify(appointment),
  });

  return created && typeof created === "object" ? created : appointment;
}