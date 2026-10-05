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
import { EditorDialog } from "../components/EditorDialog";
import { PageHeader } from "../components/PageHeader";
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
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  function edit(event: InstitutionalEvent | null) {
    model.select(event);
    setOpened(true);
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
  const dirty = model.source
    ? (form.title !== model.source.title ||
      form.description !== model.source.description ||
      form.location !== model.source.location ||
      form.startsAt !== santiagoInput(model.source.startsAt) ||
      form.endsAt !== santiagoInput(model.source.endsAt))
    : Object.values(form).some(Boolean);
  const disabled = model.source?.status === "cancelled" || model.busy;
  const startCandidates = possibleInstants(form.startsAt),
    endCandidates = possibleInstants(form.endsAt);
  const visible = model.data.filter((e) =>
    (!status || e.status === status) &&
    `${e.title} ${e.location}`.toLocaleLowerCase("es").includes(
      search.toLocaleLowerCase("es"),
    )
  );
  return (
    <>
      <PageHeader
        title="Eventos"
        description="Organiza ferias, talleres y actividades institucionales. Horarios de Santiago."
        action={
          <button
            disabled={model.loading || model.busy}
            onClick={() => edit(null)}
          >
            + Nuevo evento
          </button>
        }
      />
      {!opened && <Feedback error={model.error} message={model.message} />}
      <section className="content-list" aria-label="Eventos guardados">
        <form className="list-filters" onSubmit={(e) => e.preventDefault()}>
          <label>
            Buscar eventos<input
              type="search"
              placeholder="Título o lugar del evento"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Estado del evento<select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
        </form>
        {model.loading && (
          <p className="empty" role="status">Cargando eventos…</p>
        )}
        {!model.loading && (
          <div className="table-scroll">
            <table>
              <caption>Actividades institucionales · America/Santiago</caption>
              <thead>
                <tr>
                  <th scope="col">Evento</th>
                  <th scope="col">Horario</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td className="content-cell">
                      <strong>{e.title}</strong>
                      <span className="cell-detail">{e.location}</span>
                    </td>
                    <td>
                      <span className="cell-detail">
                        Inicio: {santiagoDisplay(e.startsAt)}
                      </span>
                      <span className="cell-detail">
                        Término: {santiagoDisplay(e.endsAt)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={"badge " + (e.status === "draft"
                          ? "status-draft"
                          : e.status === "published"
                          ? "status-active"
                          : "status-inactive")}
                      >
                        {e.status === "draft"
                          ? "Borrador"
                          : e.status === "published"
                          ? "Publicado"
                          : "Cancelado"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => edit(e)}
                      >
                        Ver o editar evento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!model.error && !visible.length && (
              <div className="empty">
                <h2>
                  {model.data.length
                    ? "No hay coincidencias"
                    : "Todavía no hay eventos"}
                </h2>
                <p>
                  {model.data.length
                    ? "Prueba otros filtros."
                    : "Crea una actividad con «Nuevo evento»."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
      {opened && (
        <EditorDialog
          title={model.source ? "Editar evento" : "Crear evento"}
          subtitle="Actividades institucionales"
          dirty={dirty}
          busy={model.busy}
          unconfirmed={model.unconfirmed}
          onClose={() => setOpened(false)}
        >
          <section aria-label="Editor de evento">
            <Feedback
              error={localError || model.error}
              message={model.message}
            />
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
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })}
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
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })}
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
                  Confirmar {confirm === "publish"
                    ? "publicación del evento"
                    : "cancelación"}
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
        </EditorDialog>
      )}
    </>
  );
}
