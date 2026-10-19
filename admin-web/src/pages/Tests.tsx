import { Link } from "react-router-dom";
import { useState } from "react";
import { useTests } from "../application/useTests";
import { Feedback } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
export function Tests() {
  const model = useTests();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const catalogs = model.data.filter((c) =>
    (!kind || c.kind === kind) &&
    `${c.code} ${c.versions.map((v) => v.title).join(" ")}`.toLocaleLowerCase(
      "es",
    ).includes(search.toLocaleLowerCase("es"))
  );
  return (
    <>
      <PageHeader
        title="Tests"
        description="Gestiona cuestionarios, revisa sus versiones y controla cuáles están activos."
        action={
          <Link className="button-link" to="/tests/new">
            + Crear cuestionario propio
          </Link>
        }
      />
      <Feedback error={model.error} />
      <form className="toolbar" onSubmit={(e) => e.preventDefault()}>
        <label>
          Buscar tests<input
            type="search"
            placeholder="Nombre o código del test"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Tipo de test<select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">Todos los tests</option>
            <option value="protected">Instrumentos protegidos</option>
            <option value="custom">Cuestionarios propios</option>
          </select>
        </label>
      </form>
      <p className="field-help">
        Publicar guarda una versión definitiva. Activarla la habilita en el
        catálogo del backend; la integración con Android se realizará después.
      </p>
      {model.loading && <p role="status">Cargando catálogos…</p>}
      {catalogs.map((c) => (
        <section
          className="card catalog-card"
          key={c.catalogId}
          aria-label={c.versions[0]?.title ?? c.code}
        >
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">{c.code}</span>
              <h2>{c.versions[0]?.title ?? c.code}</h2>
            </div>
            <span className="badge">
              {c.kind === "protected"
                ? "Instrumento protegido"
                : "Cuestionario propio"}
            </span>
          </div>
          {!c.versions.length && (
            <p>No hay versión disponible en esta base de datos.</p>
          )}
          {!!c.versions.length && (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Versiones de {c.versions[0]?.title ?? c.code}
                </caption>
                <thead>
                  <tr>
                    <th>Versión</th>
                    <th>Publicación</th>
                    <th>Disponibilidad</th>
                    <th>Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {c.versions.map((v) => (
                    <tr key={v.versionId}>
                      <td>
                        <Link to={"/tests/versions/" + v.versionId}>
                          Versión {v.version}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={"badge " +
                            (v.publicationStatus === "published"
                              ? "status-published"
                              : "status-draft")}
                        >
                          {v.publicationStatus === "published"
                            ? "Publicado"
                            : "Borrador"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={"badge " +
                            (v.active ? "status-active" : "status-inactive")}
                        >
                          {v.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>{v.revision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      {!model.loading && !model.error && !catalogs.length && (
        <div className="card empty">
          <h2>No hay tests que mostrar</h2>
          <p>
            {model.data.length
              ? "Prueba otro nombre o cambia el filtro."
              : "Crea un cuestionario propio para comenzar."}
          </p>
        </div>
      )}
    </>
  );
}
