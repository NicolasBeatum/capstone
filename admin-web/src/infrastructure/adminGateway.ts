import { auth } from "./auth";
import * as contract from "./contracts";
import type { EventContent, TestContent, TipContent } from "../domain/types";
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
let epoch = 0;
let expired = () => {};
export function configureSession(onExpired: () => void) {
  expired = onExpired;
}
export function clearRequests() {
  epoch++;
}
async function request<T>(
  method: string,
  path: string,
  parse: (v: unknown) => T,
  payload?: unknown,
): Promise<T> {
  const generation = epoch;
  const { data, error } = await auth.auth.getSession();
  if (error || !data.session) {
    clearRequests();
    expired();
    throw new ApiError(401, "Inicia sesión nuevamente.");
  }
  const bodyText = payload ? JSON.stringify(payload) : undefined;
  if (bodyText && new TextEncoder().encode(bodyText).length > 256 * 1024) {
    throw new ApiError(
      422,
      "El contenido supera el límite. Reduce el tamaño antes de guardar.",
    );
  }
  let response: Response;
  try {
    response = await fetch(
      (import.meta.env.VITE_ADMIN_API_URL ||
        "http://127.0.0.1:54321/functions/v1/admin-api") + path,
      {
        method,
        headers: {
          Authorization: "Bearer " + data.session.access_token,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        ...(bodyText ? { body: bodyText } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
  } catch {
    throw new ApiError(
      503,
      "No se pudo confirmar la operación. Conserva los datos y consulta el estado antes de reintentar.",
    );
  }
  if (generation !== epoch) throw new ApiError(401, "La sesión cambió.");
  if (response.status === 401 || response.status === 403) {
    clearRequests();
    expired();
    throw new ApiError(
      response.status,
      response.status === 403
        ? "Esta cuenta no tiene autorización administrativa."
        : "Inicia sesión nuevamente.",
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      503,
      "Respuesta del servidor inválida. Consulta el estado antes de reintentar.",
    );
  }
  if (generation !== epoch) throw new ApiError(401, "La sesión cambió.");
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body &&
        typeof body.error === "string"
      ? body.error
      : "Servicio no disponible.";
    throw new ApiError(response.status, message);
  }
  return parse(body);
}
const change = (method: string, path: string, data: Record<string, unknown>) =>
  request(method, path, contract.mutation, data);
export const adminGateway = {
  checkAccess: () => request("GET", "/session", contract.access),
  students: (query: URLSearchParams) =>
    request("GET", "/students?" + query, contract.students),
  formOptions: () => request("GET", "/catalogs", contract.options),
  recover: (id: string, requestId: string) =>
    request("POST", "/students/" + id + "/password-reset", contract.accepted, {
      requestId,
    }),
  tests: () => request("GET", "/tests", contract.catalogs),
  catalog: (id: string) =>
    request("GET", "/tests/catalogs/" + id, contract.catalog),
  version: (id: string) =>
    request("GET", "/tests/versions/" + id, contract.version),
  createTest: (content: TestContent, requestId: string) =>
    change("POST", "/tests", { ...content, requestId }),
  saveTest: (
    id: string,
    content: TestContent,
    revision: number,
    requestId: string,
  ) =>
    change("PUT", "/tests/versions/" + id + "/draft", {
      ...content,
      expectedRevision: revision,
      requestId,
    }),
  testAction: (
    id: string,
    action: "publish" | "clone" | "activation",
    revision: number,
    requestId: string,
    active?: boolean,
  ) =>
    change("POST", "/tests/versions/" + id + "/" + action, {
      expectedRevision: revision,
      requestId,
      ...(active !== undefined ? { active } : {}),
    }),
  events: () => request("GET", "/events", contract.events),
  saveEvent: (
    id: string | null,
    content: EventContent,
    revision: number,
    requestId: string,
  ) =>
    change(id ? "PUT" : "POST", "/events" + (id ? "/" + id : ""), {
      ...content,
      requestId,
      ...(id ? { expectedRevision: revision } : {}),
    }),
  eventAction: (
    id: string,
    action: "publish" | "cancel",
    revision: number,
    requestId: string,
  ) =>
    change("POST", "/events/" + id + "/" + action, {
      expectedRevision: revision,
      requestId,
    }),
  tips: () => request("GET", "/tips", contract.tips),
  saveTip: (
    id: string | null,
    content: TipContent,
    revision: number,
    requestId: string,
  ) =>
    change(id ? "PUT" : "POST", "/tips" + (id ? "/" + id : ""), {
      ...content,
      requestId,
      ...(id ? { expectedRevision: revision } : {}),
    }),
  tipAction: (
    id: string,
    action: "publish" | "activation",
    revision: number,
    requestId: string,
    active?: boolean,
  ) =>
    change("POST", "/tips/" + id + "/" + action, {
      expectedRevision: revision,
      requestId,
      ...(active !== undefined ? { active } : {}),
    }),
};
