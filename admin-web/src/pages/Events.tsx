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
  requiresRegistration: false,
  registrationUrl: "",
  registrationDeadline: "",
  registrationClosed: false,
};
export function Events() {
  const model = useEvents();
  const [form, setForm] = useState(empty),
    [startChoice, setStartChoice] = useState(""),
    [endChoice, setEndChoice] = useState(""),
    [deadlineChoice, setDeadlineChoice] = useState(""),
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
          requiresRegistration: event.requiresRegistration,
          registrationUrl: event.registrationUrl ?? "",
          registrationDeadline: event.registrationDeadline ? santiagoInput(event.registrationDeadline) : "",
          registrationClosed: event.registrationClosed,
        }
        : empty,
    );
    setStartChoice(
      event?.startsAt ? new Date(event.startsAt).toISOString() : "",
    );
    setEndChoice(event?.endsAt ? new Date(event.endsAt).toISOString() : "");
    setDeadlineChoice(event?.registrationDeadline ? new Date(event.registrationDeadline).toISOString() : "");
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
      const registrationDeadline = form.requiresRegistration && form.registrationDeadline
        ? localToInstant(form.registrationDeadline, deadlineChoice) : null;
      if (registrationDeadline && registrationDeadline > startsAt) throw Error("El plazo no puede ser posterior al inicio.");
      if (form.requiresRegistration && form.registrationUrl) {
        const url = new URL(form.registrationUrl);
        if (url.protocol !== "https:" || url.username || url.password || /[\s\\]/.test(form.registrationUrl)) throw Error("Usa un enlace HTTPS válido, sin credenciales.");
      }
      await model.save({ ...form, startsAt, endsAt, registrationDeadline,
        registrationUrl: form.requiresRegistration ? form.registrationUrl || null : null,
        registrationClosed: form.requiresRegistration && form.registrationClosed });
    } catch (e) {
      setLocalError(errorMessage(e));
    }
  }
  const dirty = model.source
    ? (form.title !== model.source.title ||
      form.description !== model.source.description ||
      form.location !== model.source.location ||
      form.startsAt !== santiagoInput(model.source.startsAt) ||
      form.endsAt !== santiagoInput(model.source.endsAt) ||
      form.requiresRegistration !== model.source.requiresRegistration ||
      form.registrationUrl !== (model.source.registrationUrl ?? "") ||
      form.registrationDeadline !== (model.source.registrationDeadline ? santiagoInput(model.source.registrationDeadline) : "") ||
      form.registrationClosed !== model.source.registrationClosed)
    : Object.values(form).some(Boolean);
  const disabled = model.source?.status === "cancelled" || model.busy;
  const startCandidates = possibleInstants(form.startsAt),
    endCandidates = possibleInstants(form.endsAt),
    deadlineCandidates = possibleInstants(form.registrationDeadline);
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
                <section aria-label="Condiciones de inscripción">
                  <h3>Inscripción</h3>
                  <label>Tipo de participación<select value={form.requiresRegistration ? "required" : "free"}
                    onChange={(e) => setForm({ ...form, requiresRegistration: e.target.value === "required", registrationUrl: "", registrationDeadline: "", registrationClosed: false })}>
                    <option value="free">No requiere inscripción</option><option value="required">Requiere inscripción</option>
                  </select></label>
                  {form.requiresRegistration && <>
                    <label>Enlace de inscripción<input type="url" maxLength={2048} placeholder="https://…"
                      value={form.registrationUrl} onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })} /></label>
                    <label>Plazo de inscripción en Santiago<input type="datetime-local" value={form.registrationDeadline}
                      onChange={(e) => { setForm({ ...form, registrationDeadline: e.target.value }); setDeadlineChoice(""); }} /></label>
                    {deadlineCandidates.length > 1 && <label>Desfase horario del plazo<select value={deadlineChoice} onChange={(e) => setDeadlineChoice(e.target.value)}>
                      <option value="">Selecciona el desfase</option>{deadlineCandidates.map((instant) => <option key={instant} value={instant}>{offsetLabel(instant)}</option>)}
                    </select></label>}
                    <label><input type="checkbox" checked={form.registrationClosed} onChange={(e) => setForm({ ...form, registrationClosed: e.target.checked })} />Cerrar inscripción manualmente</label>
                    <p>El enlace y el plazo pueden completarse en el borrador; son obligatorios al publicar. Reabrir exige un plazo e inicio futuros.</p>
                  </>}
                  <p>Agregar a la agenda guarda el interés del estudiante; la inscripción se realiza en el sitio externo.</p>
                  {model.source?.status === "published" && <p>Cambiar fecha, horario o ubicación pedirá al estudiante actualizar su agenda.</p>}
                </section>
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
