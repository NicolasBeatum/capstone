import { type FormEvent, useState } from "react";
import { useStudents } from "../application/useStudents";
import { Feedback } from "../components/Feedback";
import type { Student } from "../domain/types";
export function Students() {
  const model = useStudents();
  const [search, setSearch] = useState(""),
    [career, setCareer] = useState(""),
    [campus, setCampus] = useState(""),
    [selected, setSelected] = useState<Student | null>(null);
  const query = (page: number) =>
    new URLSearchParams({
      search,
      careerId: career,
      campusId: campus,
      page: String(page),
      pageSize: "25",
    });
  function submit(e: FormEvent) {
    e.preventDefault();
    void model.load(query(1));
  }
  return (
    <>
      <h1>Alumnos</h1>
      <p className="muted">Datos de registro y recuperación de acceso</p>
      <form className="toolbar" onSubmit={submit}>
        <label>
          Buscar por nombre o correo<input
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Sede<select
            value={campus}
            onChange={(e) => {
              setCampus(e.target.value);
              setCareer("");
            }}
          >
            <option value="">Todas las sedes</option>
            {model.options?.campuses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Carrera<select
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          >
            <option value="">Todas las carreras</option>
            {model.options?.careers.filter((c) =>
              !campus || c.campusId === campus
            ).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button disabled={model.loading}>Buscar</button>
      </form>
      <Feedback error={model.error} message={model.message} />
      {model.loading && <p role="status">Cargando alumnos…</p>}
      {selected && (
        <section className="card" aria-label="Confirmar recuperación">
          <h2>Enviar enlace de recuperación</h2>
          <p>
            Se enviará al correo vigente de la cuenta de {selected.name}:{" "}
            {selected.email}.
          </p>
          <div className="actions">
            <button
              disabled={model.busy}
              onClick={() =>
                void model.recover(selected.id).then((ok) => {
                  if (ok) {
                    setSelected(null);
                  }
                })}
            >
              Confirmar envío
            </button>
            <button
              className="secondary"
              disabled={model.busy}
              onClick={() =>
                setSelected(null)}
            >
              Volver
            </button>
          </div>
        </section>
      )}
      {model.data && (
        <>
          <p>{model.data.total} alumnos encontrados</p>
          <div className="table-scroll">
            <table>
              <caption className="muted">Registro de alumnos</caption>
              <thead>
                <tr>
                  {[
                    "Nombre",
                    "Correo de la cuenta",
                    "Carrera",
                    "Sede",
                    "Acceso",
                  ].map((t) => <th key={t} scope="col">{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {model.data.items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email ?? "Sin cuenta recuperable"}</td>
                    <td>{s.career ?? "No disponible"}</td>
                    <td>{s.campus ?? "No disponible"}</td>
                    <td>
                      <button
                        className="secondary"
                        disabled={!s.email || model.busy}
                        onClick={() => setSelected(s)}
                      >
                        Enviar recuperación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!model.data.items.length && (
            <p className="empty">
              No hay alumnos que coincidan con los filtros.
            </p>
          )}
          <div className="actions">
            <button
              className="secondary"
              disabled={model.loading || model.data.page <= 1}
              onClick={() => void model.load(query(model.data!.page - 1))}
            >
              Anterior
            </button>
            <p>Página {model.data.page}</p>
            <button
              className="secondary"
              disabled={model.loading ||
                model.data.page * model.data.pageSize >= model.data.total}
              onClick={() => void model.load(query(model.data!.page + 1))}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </>
  );
}
