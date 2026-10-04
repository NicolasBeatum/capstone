import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import {
  HttpError,
  readPayload,
  uuid,
  validateMutation,
} from "./validation.ts";
import { requestRecovery } from "./recovery.ts";
const origin = Deno.env.get("ADMIN_WEB_ORIGIN") ?? "http://127.0.0.1:5173";
const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const timedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(8000) });
const server = url && key
  ? createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: timedFetch },
  })
  : null;
const messages: Record<number, string> = {
  401: "Sesión inválida. Inicia sesión nuevamente.",
  403: "Esta cuenta no tiene autorización administrativa.",
  404: "Recurso no disponible.",
  409:
    "El recurso cambió o la petición está en conflicto. Conserva tu formulario y recarga.",
  422: "Revisa los datos ingresados.",
  429: "Límite de solicitudes alcanzado. Inténtalo más tarde.",
  503: "Servicio no disponible. Inténtalo nuevamente.",
};
function rpcError(code: string) {
  const statuses: Record<string, number> = {
    P0401: 401,
    P0403: 403,
    P0404: 404,
    P0409: 409,
    P0422: 422,
    P0429: 429,
    "23505": 422,
    "23503": 422,
    "23514": 422,
    "23502": 422,
    "22P02": 422,
    "22007": 422,
    "22008": 422,
    "22003": 422,
  };
  return new HttpError(statuses[code] ?? 503, messages[statuses[code] ?? 503]);
}
async function rpc(name: string, args: Record<string, unknown>) {
  if (!server) throw new HttpError(503, messages[503]);
  const response = await server.rpc(name, args);
  if (response.error) throw rpcError(response.error.code);
  return response.data;
}
Deno.serve(async (request) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin && request.headers.get("origin") === origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  const reply = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), { status, headers });
  try {
    if (!server || !origin) throw new HttpError(503, messages[503]);
    if (
      request.headers.has("origin") && request.headers.get("origin") !== origin
    ) throw new HttpError(403, messages[403]);
    if (request.method === "OPTIONS") {
      headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,OPTIONS";
      headers["Access-Control-Allow-Headers"] =
        "authorization,apikey,content-type";
      return new Response(null, { status: 204, headers });
    }
    const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)
      ?.[1];
    if (!token) throw new HttpError(401, messages[401]);
    const verified = await server.auth.getUser(token);
    if (
      verified.error &&
      (verified.error.status === 0 ||
        verified.error.status && verified.error.status >= 500)
    ) throw new HttpError(503, messages[503]);
    if (verified.error || !verified.data.user) {
      throw new HttpError(401, messages[401]);
    }
    let claims: Record<string, unknown>;
    try {
      claims = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
    } catch {
      throw new HttpError(401, messages[401]);
    }
    const actor = verified.data.user.id;
    const session = claims.session_id;
    if (
      claims.sub !== actor || typeof session !== "string" || !uuid.test(session)
    ) throw new HttpError(401, messages[401]);
    const parsed = new URL(request.url);
    const path = parsed.pathname.replace(/^\/admin-api/, "").replace(
      /^\/functions\/v1\/admin-api/,
      "",
    ) || "/";
    const identity = { p_actor: actor, p_session: session };
    await rpc("admin_access", identity);
    if (request.method === "GET" && path === "/session") {
      return reply(200, await rpc("admin_access", identity));
    }
    if (request.method === "GET") {
      const query: Record<string, string> = {};
      for (const [name, value] of parsed.searchParams) {
        if (name in query) throw new HttpError(422, messages[422]);
        query[name] = value;
      }
      return reply(
        200,
        await rpc("admin_read", { ...identity, p_path: path, p_query: query }),
      );
    }
    const payload = validateMutation(
      request.method,
      path,
      await readPayload(request),
    );
    if (path.endsWith("/password-reset")) {
      const student = path.split("/")[2];
      const args = {
        ...identity,
        p_student: student,
        p_request: payload.requestId,
      };
      const result = await requestRecovery({
        reserve: () => rpc("admin_reset_reserve", args),
        recipient: () => rpc("admin_reset_recipient", args),
        send: async (email) => {
          const response = await server.auth.resetPasswordForEmail(email, {
            redirectTo: origin + "/recover",
          });
          return !response.error;
        },
        finish: async (state) => {
          await rpc("admin_reset_finish", {
            ...identity,
            p_request: payload.requestId,
            p_state: state,
          });
        },
      });
      return reply(200, result);
    }
    return reply(
      200,
      await rpc("admin_mutate", {
        ...identity,
        p_method: request.method,
        p_path: path,
        p_payload: payload,
      }),
    );
  } catch (error) {
    const e = error instanceof HttpError
      ? error
      : new HttpError(503, messages[503]);
    return reply(e.status, { error: messages[e.status] ?? e.message });
  }
});
