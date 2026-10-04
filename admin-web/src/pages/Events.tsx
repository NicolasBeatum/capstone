import { type FormEvent, useState } from "react";
import { useEvents } from "../application/useEvents";
import { errorMessage, Feedback } from "../components/Feedback";
import type { InstitutionalEvent } from "../domain/types";
import {
  localToInstant,
  offsetLabel,
  possibleInstants,
  santiagoDisplay,
  santiagoInput,
} from "../domain/eventTime";
const empty = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
};
export function Events() {
  const model = useEvents();
  const [form, setForm] = useState(empty),
    [startChoice, setStartChoice] = useState(""),
    [endChoice, setEndChoice] = useState(""),
    [localError, setLocalError] = useState(""),
    [confirm, setConfirm] = useState<"publish" | "cancel" | null>(null);
  function edit(event: InstitutionalEvent | null) {
    model.select(event);
    setForm(
      event
        ? {
          title: event.title,
          description: event.description,
          location: event.location,
          startsAt: santiagoInput(event.startsAt),
          endsAt: santiagoInput(event.endsAt),
        }
        : empty,
    );
    setStartChoice(
      event?.startsAt ? new Date(event.startsAt).toISOString() : "",
    );
    setEndChoice(event?.endsAt ? new Date(event.endsAt).toISOString() : "");
    setLocalError("");
    setConfirm(null);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLocalError("");
    try {
      const startsAt = localToInstant(form.startsAt, startChoice),
        endsAt = localToInstant(form.endsAt, endChoice);
      if (endsAt < startsAt) {
        throw Error("El término debe ser posterior o igual al inicio.");
      }
      await model.save({ ...form, startsAt, endsAt });
    } catch (e) {
      setLocalError(errorMessage(e));
    }
  }
  const dirty = !!model.source &&
    (form.title !== model.source.title ||
      form.description !== model.source.description ||
      form.location !== model.source.location ||
      form.startsAt !== santiagoInput(model.source.startsAt) ||
      form.endsAt !== santiagoInput(model.source.endsAt));
  const disabled = model.source?.status === "cancelled" || model.busy;
  const startCandidates = possibleInstants(form.startsAt),
    endCandidates = possibleInstants(form.endsAt);
  return (
    <>
      <h1>Eventos</h1>
      <p className="muted">
        Ferias, talleres y actividades institucionales. Horario:
        America/Santiago.
      </p>
      <Feedback error={localError || model.error} message={model.message} />
      <button
        className="secondary"
        disabled={model.busy}
        onClick={() => edit(null)}
      >
        Nuevo evento
      </button>
      <section className="card" aria-label="Editor de evento">
        <h2>{model.source ? "Editar evento" : "Crear borrador"}</h2>
        {model.source && (
          <p>
            {model.source.status === "draft"
              ? "Borrador"
              : model.source.status === "published"
              ? "Publicado"
              : "Cancelado"} · Revisión {model.source.revision}
          </p>
        )}
        <form onSubmit={(e) => void submit(e)}>
          <fieldset disabled={disabled}>
            <legend>Datos del evento</legend>
            <label>
              Título del evento<input
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Descripción del evento<textarea
                maxLength={5000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label>
              Lugar<input
                required
                maxLength={160}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <div className="grid">
              <label>
                Inicio en Santiago<input
                  type="datetime-local"
                  required
                  value={form.startsAt}
                  onChange={(e) => {
                    setForm({ ...form, startsAt: e.target.value });
                    setStartChoice("");
                  }}
                />
              </label>
              <label>
                Término en Santiago<input
                  type="datetime-local"
                  required
                  value={form.endsAt}
                  onChange={(e) => {
                    setForm({ ...form, endsAt: e.target.value });
                    setEndChoice("");
                  }}
                />
              </label>
            </div>
            {startCandidates.length > 1 && (
              <label>
                Desfase horario del inicio<select
                  required
                  value={startChoice}
                  onChange={(e) => setStartChoice(e.target.value)}
                >
                  <option value="">Elige un instante</option>
                  {startCandidates.map((i) => (
                    <option key={i} value={i}>{offsetLabel(i)}</option>
                  ))}
                </select>
              </label>
            )}
            {endCandidates.length > 1 && (
              <label>
                Desfase horario del término<select
                  required
                  value={endChoice}
                  onChange={(e) => setEndChoice(e.target.value)}
                >
                  <option value="">Elige un instante</option>
                  {endCandidates.map((i) => (
                    <option key={i} value={i}>{offsetLabel(i)}</option>
                  ))}
                </select>
              </label>
            )}
            <button disabled={disabled}>Guardar evento</button>
          </fieldset>
        </form>
        <div className="actions">
          {model.source?.status === "draft" && (
            <button
              disabled={model.busy}
              onClick={() => {
                if (dirty) {
                  setLocalError("Guarda los cambios antes de publicar.");
                } else setConfirm("publish");
              }}
            >
              Publicar evento
            </button>
          )}
          {model.source?.status === "published" && (
            <button
              className="danger"
              disabled={model.busy}
              onClick={() => setConfirm("cancel")}
            >
              Cancelar evento
            </button>
          )}
          <button
            className="secondary"
            disabled={model.busy}
            onClick={() =>
              void model.reload().then((event) => {
                if (event) edit(event);
              })}
          >
            Recargar estado del evento
          </button>
        </div>
        {confirm && (
          <section aria-label="Confirmar evento">
            <p>
              {confirm === "publish"
                ? "Publicar confirma la disponibilidad en el backend."
                : "Cancelar conserva el contenido y registra el estado cancelado."}
            </p>
            <button
              disabled={model.busy}
              onClick={() => {
                if (dirty) {
                  setLocalError(
                    "Guarda los cambios antes de cambiar el estado.",
                  );
                  return;
                }
                void model.action(confirm).then((ok) => {
                  if (ok) setConfirm(null);
                });
              }}
            >
              Confirmar{" "}
              {confirm === "publish" ? "publicación del evento" : "cancelación"}
            </button>{" "}
            <button
              className="secondary"
              disabled={model.busy}
              onClick={() => setConfirm(null)}
            >
              Volver
            </button>
          </section>
        )}
      </section>
      {model.loading && <p role="status">Cargando eventos…</p>}
      {model.data.map((e) => (
        <section className="card" key={e.id} aria-label={e.title}>
          <h2>{e.title}</h2>
          <p>
            {e.status === "draft"
              ? "Borrador"
              : e.status === "published"
              ? "Publicado"
              : "Cancelado"} · {santiagoDisplay(e.startsAt)} →{" "}
            {santiagoDisplay(e.endsAt)}
          </p>
          <p>{e.location}</p>
          <button
            className="secondary"
            disabled={model.busy}
            onClick={() =>
              edit(e)}
          >
            Ver o editar evento
          </button>
        </section>
      ))}
      {!model.loading && !model.data.length && (
        <p>No hay eventos institucionales.</p>
      )}
    </>
  );
}
