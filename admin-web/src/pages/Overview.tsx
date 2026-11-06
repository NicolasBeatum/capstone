import { PageHeader } from "../components/PageHeader";
import { Link } from "react-router-dom";
import { useOverview } from "../application/useOverview";
import { Feedback } from "../components/Feedback";
import { NavigationIcon } from "../components/NavigationIcon";
export function Overview() {
  const model = useOverview();
  const metrics = [
    [
      "Alumnos registrados",
      model.students?.total,
      "Total del registro de DuocMind",
    ],
    [
      "Carreras disponibles",
      model.options?.careers.length,
      "Carreras del catálogo institucional",
    ],
  ] as const;
  return (
    <>
      <PageHeader
        title="Dashboard de Bienestar y Salud"
        description="El registro de alumnos y las herramientas del equipo, en un solo lugar."
        action={
          <button
            className="secondary"
            disabled={model.loading}
            onClick={() => void model.reload()}
          >
            Actualizar resumen
          </button>
        }
      />
      <Feedback error={model.error} />
      {model.loading && <p role="status">Cargando resumen…</p>}
      <div className="overview-metrics">
        {metrics.map(([title, value, detail]) => (
          <section className="card" key={title} aria-label={title}>
            <h2>{title}</h2>
            <strong className="metric-value">{value ?? "—"}</strong>
            <p className="field-help">{detail}</p>
          </section>
        ))}
      </div>
      <h2>Herramientas del equipo</h2>
      <div className="overview-shortcuts">
        {[
          [
            "/students",
            "Alumnos",
            "Buscar por nombre o correo y consultar su carrera.",
          ],
          [
            "/tests",
            "Tests",
            "Crear cuestionarios y gestionar su publicación.",
          ],
          ["/events", "Eventos", "Preparar ferias, talleres y actividades."],
        ].map(([path, title, description]) => (
          <Link key={path} to={path} className="card overview-shortcut">
            <NavigationIcon section={title} />
            <strong>{title}</strong>
            <span>{description}</span>
          </Link>
        ))}
      </div>
      <section className="card sharing-status" aria-label="Emociones agregadas">
        <h2>Emociones de quienes eligen compartir</h2>
        <p>
          La página Emociones muestra datos agregados y anónimos de estudiantes
          que aceptaron compartirlos. No incluye historiales individuales.
        </p>
        <p>
          <Link to="/emotions">Ver Emociones →</Link>
        </p>
      </section>
      <section aria-label="Vista del registro de alumnos">
        <div className="overview-section-heading">
          <h2>Alumnos del registro</h2>
          <Link to="/students">Ver registro completo →</Link>
        </div>
        {model.students && (
          <div className="table-scroll">
            <table>
              <caption>
                Hasta cinco alumnos del registro; el listado completo incluye
                búsqueda y filtros.
              </caption>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo de la cuenta</th>
                  <th>Carrera</th>
                </tr>
              </thead>
              <tbody>
                {model.students.items.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email ?? "Sin cuenta vinculada"}</td>
                    <td>{student.career ?? "Sin información"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!model.students.items.length && (
              <p className="empty">No hay alumnos registrados.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
