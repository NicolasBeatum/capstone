import type { WellbeingCareers } from "../../domain/types";
import { decimal, integer, moodLabel, percent } from "../../domain/wellbeing";

/** Tabla comparativa en orden alfabético; la barra del ánimo va de Muy mal a Muy bien. */
export function CareersTab({ data }: { data: WellbeingCareers }) {
  return (
    <section className="card" aria-labelledby="wb-careers-title">
      <h2 id="wb-careers-title" className="wb-card-title">Comparación por carrera</h2>
      <p className="chart-sub">
        Solo carreras con 5 o más participantes; el resto, y quienes no tienen carrera registrada,
        se agrupa en «Otras carreras». Orden alfabético; no es un ranking.
      </p>
      {data.rows.length === 0
        ? <p className="field-help">El desglose por carrera no se muestra en este periodo para proteger a grupos pequeños.</p>
        : (
          <div className="table-scroll">
            <table className="wb-table">
              <caption className="sr-only">Comparación por carrera</caption>
              <thead>
                <tr>
                  <th scope="col">Carrera</th>
                  <th scope="col" className="num">Participantes</th>
                  <th scope="col">Ánimo promedio</th>
                  <th scope="col" className="num">Días difíciles</th>
                  <th scope="col" className="num">Estrés alto</th>
                  <th scope="col">Motivo principal</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.name}>
                    <th scope="row">{r.name}</th>
                    <td className="num">{integer(r.participants)}</td>
                    <td>
                      <span className="wb-mood">
                        <span className="wb-mood-track" aria-hidden="true">
                          <span
                            className="wb-mood-bar"
                            style={{
                              left: Math.min(50, ((r.average - 1) / 4) * 100) + "%",
                              width: Math.abs(((r.average - 3) / 4) * 100) + "%",
                              background: r.average < 3 ? "var(--mood-2)" : "var(--mood-4)",
                            }}
                          />
                        </span>
                        {moodLabel(r.average)} <span className="wb-muted">{decimal(r.average)}</span>
                      </span>
                    </td>
                    <td className="num">{r.difficultShare === null ? <span className="wb-muted">menos de 5</span> : percent(r.difficultShare)}</td>
                    <td className="num">{r.highStressShare === null ? <span className="wb-muted">menos de 5 tests</span> : percent(r.highStressShare)}</td>
                    <td>{r.topReason ? <span className="wb-pill">{r.topReason}</span> : <span className="wb-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}
