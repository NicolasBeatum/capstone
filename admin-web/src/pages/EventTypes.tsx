import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useEventTypes } from "../application/useEventTypes";
import { EditorDialog } from "../components/EditorDialog";
import { Feedback } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import type { EventType, EventTypeContent } from "../domain/types";

const empty: EventTypeContent = { code: "", name: "", order: 0 };
export function EventTypes() {
  const model = useEventTypes();
  const [opened, setOpened] = useState(false);
  const [form, setForm] = useState<EventTypeContent>(empty);
  function edit(type: EventType | null) {
    model.select(type);
    setForm(
      type ? { code: type.code, name: type.name, order: type.order } : empty,
    );
    setOpened(true);
  }
  const dirty = model.source
    ? form.code !== model.source.code || form.name !== model.source.name ||
      form.order !== model.source.order
    : form.code !== "" || form.name !== "" || form.order !== 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await model.save(form);
    if (saved) {
      setForm({ code: saved.code, name: saved.name, order: saved.order });
    }
  }
  return (
    <>
      <PageHeader
        title="Tipos de evento"
        description="Administra las categorías disponibles para los eventos institucionales."
        action={
          <button
            disabled={model.loading || model.busy}
            onClick={() => edit(null)}
          >
            + Nuevo tipo
          </button>
        }
      />
      <div className="actions">
        <Link to="/events">Volver a eventos</Link>
        <button
          className="secondary"
          disabled={model.busy}
          onClick={() => void model.reload()}
        >
          Recargar catálogo
        </button>
      </div>
      {!opened && <Feedback error={model.error} message={model.message} />}
      <section
        className="content-list"
        aria-label="Catálogo de tipos de evento"
      >
        {model.loading
          ? <p role="status">Cargando tipos de evento…</p>
          : (
            <div className="table-scroll">
              <table>
                <caption>
                  Tipos disponibles para eventos institucionales
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Código</th>
                    <th scope="col">Orden</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {model.data.map((type) => (
                    <tr key={type.id}>
                      <td>
                        <strong>{type.name}</strong>
                      </td>
                      <td>{type.code}</td>
                      <td>{type.order}</td>
                      <td>
                        <button
                          className="secondary"
                          disabled={model.busy}
                          onClick={() => edit(type)}
                        >
                          Editar tipo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!model.error && !model.data.length && (
                <p className="empty">
                  Todavía no hay tipos. Crea uno con «Nuevo tipo».
                </p>
              )}
            </div>
          )}
      </section>
      {opened && (
        <EditorDialog
          title={model.source
            ? "Editar tipo de evento"
            : "Crear tipo de evento"}
          subtitle="Catálogo institucional"
          dirty={dirty}
          busy={model.busy}
          unconfirmed={model.unconfirmed}
          onClose={() => setOpened(false)}
        >
          <Feedback error={model.error} message={model.message} />
          <form onSubmit={(event) => void submit(event)}>
            <fieldset disabled={model.busy}>
              <legend>Datos del tipo</legend>
              <label>
                Nombre del tipo<input
                  required
                  maxLength={40}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label>
                Código del tipo<input
                  required
                  minLength={2}
                  maxLength={32}
                  pattern="[a-z][a-z0-9_]{1,31}"
                  readOnly={!!model.source}
                  aria-describedby="type-code-help"
                  value={form.code}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })}
                />
              </label>
              <p id="type-code-help">
                Usa minúsculas, números y guion bajo; comienza con una letra. El
                código queda fijo después de crear el tipo.
              </p>
              <label>
                Orden de presentación<input
                  type="number"
                  required
                  min={0}
                  max={32767}
                  step={1}
                  value={Number.isNaN(form.order) ? "" : form.order}
                  onChange={(event) =>
                    setForm({ ...form, order: event.target.valueAsNumber })}
                />
              </label>
              {model.source && (
                <p>
                  Renombrar este tipo cambia su etiqueta en todos los eventos
                  que lo utilizan. Revisión {model.source.revision}.
                </p>
              )}
              <button>Guardar tipo</button>
            </fieldset>
          </form>
          <button
            className="secondary"
            disabled={model.busy}
            onClick={() =>
              void model.reload().then((type) => {
                if (type) {
                  setForm({
                    code: type.code,
                    name: type.name,
                    order: type.order,
                  });
                }
              })}
          >
            Recargar estado del tipo
          </button>
        </EditorDialog>
      )}
    </>
  );
}
