export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export type Payload = Record<string, unknown>;
export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function object(value: unknown): Payload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(422, "Objeto requerido.");
  }
  return value as Payload;
}
export function fields(
  value: Payload,
  allowed: string[],
  required: string[] = allowed,
) {
  if (
    Object.keys(value).some((k) => !allowed.includes(k)) ||
    required.some((k) => !(k in value))
  ) throw new HttpError(422, "Campos inválidos.");
}
export function validateMutation(
  method: string,
  path: string,
  input: unknown,
): Payload {
  const p = object(input);
  if (typeof p.requestId !== "string" || !uuid.test(p.requestId)) {
    throw new HttpError(422, "Identificador de petición inválido.");
  }
  const base = ["requestId"];
  if (
    path !== "/tests" && path !== "/events" && path !== "/tips" &&
    !path.endsWith("/password-reset")
  ) {
    if (
      typeof p.expectedRevision !== "number" ||
      !Number.isSafeInteger(p.expectedRevision) || p.expectedRevision < 1
    ) throw new HttpError(422, "Revisión requerida.");
    base.push("expectedRevision");
  }
  if (
    path === "/tests" && method === "POST" ||
    /\/tests\/versions\/[1-9][0-9]*\/draft$/.test(path) && method === "PUT"
  ) {
    fields(p, [...base, "title", "description", "questions", "levels"]);
    text(p.title, 160);
    text(p.description, 5000, true);
    if (
      !Array.isArray(p.questions) || p.questions.length > 100 ||
      !Array.isArray(p.levels) || p.levels.length > 100
    ) throw new HttpError(422, "Preguntas y niveles inválidos.");
    for (const raw of p.questions) {
      const q = object(raw);
      fields(q, ["text", "helper", "options"], ["text", "options"]);
      text(q.text, 5000);
      if ("helper" in q) text(q.helper, 5000, true);
      if (
        !Array.isArray(q.options) || q.options.length < 2 ||
        q.options.length > 20
      ) {
        throw new HttpError(
          422,
          "Cada pregunta requiere entre dos y veinte opciones.",
        );
      }
      for (const rawOption of q.options) {
        const o = object(rawOption);
        fields(o, ["text", "score"]);
        text(o.text, 160);
        integer(o.score, 0, 1000);
      }
    }
    for (const raw of p.levels) {
      const l = object(raw);
      fields(l, ["key", "label", "content", "min", "max"]);
      text(l.key, 80);
      text(l.label, 160);
      text(l.content, 5000);
      integer(l.min, 0, 100000);
      integer(l.max, 0, 100000);
    }
  } else if (
    path === "/events" && method === "POST" ||
    /^\/events\/[0-9a-f-]{36}$/.test(path) && method === "PUT"
  ) {
    fields(p, [
      ...base,
      "title",
      "description",
      "location",
      "startsAt",
      "endsAt",
    ]);
    text(p.title, 160);
    text(p.description, 5000, true);
    text(p.location, 160);
    for (const key of ["startsAt", "endsAt"]) {
      if (
        typeof p[key] !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(p[key]) ||
        !Number.isFinite(Date.parse(p[key]))
      ) throw new HttpError(422, "Fechas inválidas.");
    }
  } else if (
    path === "/tips" && method === "POST" ||
    /^\/tips\/[1-9][0-9]*$/.test(path) && method === "PUT"
  ) {
    fields(p, [...base, "title", "content", "rules"]);
    text(p.title, 160);
    text(p.content, 5000);
    if (!Array.isArray(p.rules) || p.rules.length > 100) {
      throw new HttpError(422, "Reglas inválidas.");
    }
    for (const raw of p.rules) {
      const r = object(raw);
      if (r.kind === "mood") {
        fields(r, ["kind", "mood"]);
        if (
          !["Muy mal", "Mal", "Neutro", "Bien", "Muy bien"].includes(
            String(r.mood),
          )
        ) throw new HttpError(422, "Ánimo inválido.");
      } else if (r.kind === "result") {
        fields(r, ["kind", "catalogId", "versionId", "version", "level"]);
        if (
          typeof r.catalogId !== "string" || !uuid.test(r.catalogId) ||
          typeof r.versionId !== "string" || !decimal(r.versionId)
        ) throw new HttpError(422, "Identificadores inválidos.");
        integer(r.version, 1, 2147483647);
        text(r.level, 80);
      } else throw new HttpError(422, "Regla inválida.");
    }
  } else if (path.endsWith("/activation") && method === "POST") {
    fields(p, [...base, "active"]);
    if (typeof p.active !== "boolean") {
      throw new HttpError(422, "Disponibilidad inválida.");
    }
  } else if (
    method === "POST" &&
    /^\/(tests\/versions\/[1-9][0-9]*\/(clone|publish)|events\/[0-9a-f-]{36}\/(publish|cancel)|tips\/[1-9][0-9]*\/publish|students\/[1-9][0-9]*\/password-reset)$/
      .test(path)
  ) fields(p, base);
  else throw new HttpError(404, "Operación no disponible.");
  return p;
}
export function decimal(s: string) {
  return /^[1-9][0-9]{0,18}$/.test(s) && BigInt(s) <= 9223372036854775807n;
}
function text(v: unknown, max: number, optional = false) {
  if (typeof v !== "string" || v.length > max || (!optional && !v.trim())) {
    throw new HttpError(422, "Texto inválido.");
  }
}
function integer(v: unknown, min: number, max: number) {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min || v > max) {
    throw new HttpError(422, "Número inválido.");
  }
}
export async function readPayload(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(422, "Contenido requerido.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256 * 1024) {
        await reader.cancel();
        throw new HttpError(422, "Contenido demasiado grande.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(422, "JSON inválido.");
  }
}
