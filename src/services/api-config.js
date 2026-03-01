export const BASE_URL = "http://localhost:3333";

/**
 Fetch wrapper used across the app.

 Goals:
 - Provide a consistent timeout behavior
 - Parse JSON safely (without crashing on invalid content)
 - Throw human-readable errors for UI consumption

 Note:
 - User-facing messages remain in PT-BR, since the UI is PT-BR.
 */
export async function apiFetch(path, options = {}) {
  const { timeoutMs = 8000, headers = {}, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");

    let data = null;

    if (isJson) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await res.text();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && data.message) ||
        `Falha na requisição (${res.status}). Tente novamente.`;

      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error("Tempo de resposta excedido. Verifique sua conexão e tente novamente.");
    }

    throw e instanceof Error ? e : new Error("Erro inesperado na requisição.");
  } finally {
    clearTimeout(timer);
  }
}