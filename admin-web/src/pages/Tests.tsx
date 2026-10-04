import { Link } from "react-router-dom";
import { useTests } from "../application/useTests";
import { Feedback } from "../components/Feedback";
export function Tests() {
  const model = useTests();
  return (
    <>
      <div className="toolbar">
        <h1>Tests</h1>
        <Link to="/tests/new">Crear cuestionario propio</Link>
      </div>
      <p className="muted">
        Publicar y habilitar confirma el estado del backend. La recepción en
        Android corresponde a una integración posterior.
      </p>
      <Feedback error={model.error} />
      {model.loading && <p role="status">Cargando catálogos…</p>}
      {model.data.map((c) => (
        <section
          className="card"
          key={c.catalogId}
          aria-label={c.versions[0]?.title ?? c.code}
        >
          <h2>{c.versions[0]?.title ?? c.code}</h2>
          <p>
            <span className="badge">
              {c.kind === "protected"
                ? "Instrumento protegido"
                : "Cuestionario propio"}
            </span>
          </p>
          {!c.versions.length && (
            <p>No hay versión disponible en esta base de datos.</p>
          )}
          {c.versions.map((v) => (
            <p key={v.versionId}>
              <Link to={"/tests/versions/" + v.versionId}>
                Versión {v.version}
              </Link>{" "}
              · {v.publicationStatus === "published" ? "Publicado" : "Borrador"}
              {" "}
              · {v.active ? "Activo" : "Inactivo"} · Revisión {v.revision}
            </p>
          ))}
        </section>
      ))}
      {!model.loading && !model.data.length && <p>No hay catálogos.</p>}
    </>
  );
}
