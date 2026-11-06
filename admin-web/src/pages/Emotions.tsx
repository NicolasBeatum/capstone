import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Feedback } from "../components/Feedback";
import { useEmotions } from "../application/useEmotions";
import { emotionState } from "../domain/emotionState";
import type {
  EmotionCareer,
  EmotionDashboard,
  EmotionDistribution,
  EmotionPeriod,
  EmotionWeek,
} from "../domain/types";

const PERIODS: EmotionPeriod[] = [7, 30, 90];
const decimal = (n: number) =>
  n.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = (n: number) => n.toLocaleString("es-CL");
// Las fechas llegan como YYYY-MM-DD de Santiago; se formatean sin convertir de zona.
const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).replace(".", "");
const longDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export function Emotions() {
  const model = useEmotions();
  const { data } = model;
  return (
    <>
      <PageHeader
        title="Emociones"
        description="Cómo se sienten los estudiantes que eligieron compartir sus registros de forma anónima."
        action={
          <button
            className="secondary"
            disabled={model.loading}
            onClick={() => void model.reload()}
          >
            Actualizar
          </button>
        }
      />
      <section className="card emotions-note" aria-label="Alcance de los datos">
        <p>
          <strong>Datos agregados y voluntarios.</strong>{" "}
          Incluyen solo a estudiantes que aceptaron compartir información
          anónima con Bienestar. No permiten identificar personas y no tienen
          valor diagnóstico.
        </p>
      </section>
      <div className="period-picker" role="group" aria-label="Periodo">
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            className={model.days === period ? "" : "secondary"}
            aria-pressed={model.days === period}
            disabled={model.loading && model.days !== period}
            onClick={() => model.setDays(period)}
          >
            Últimos {period} días
          </button>
        ))}
      </div>
      <Feedback error={model.error} />
      {model.loading && <p role="status">Cargando emociones…</p>}
      {data && !data.sufficient && (
        <section className="card emotions-empty" role="status" aria-label="Datos insuficientes">
          <h2>Aún no hay datos suficientes</h2>
          <p>
            Para este periodo todavía no se reúnen suficientes registros
            voluntarios para mostrarlos de forma anónima. Por eso no se
            muestra ningún valor parcial. Prueba con un periodo más largo o
            vuelve más adelante.
          </p>
        </section>
      )}
      {data?.sufficient && <Results data={data} />}
    </>
  );
}

function Results({ data }: { data: EmotionDashboard }) {
  const scale = data.distribution;
  const average = data.average ?? 0;
  return (
    <div className="emotions">
      <p className="field-help">
        Del {longDate(data.from)} al {longDate(data.to)}. Escala de 1 (Muy mal)
        a 5 (Muy bien).
      </p>
      <div className="overview-metrics emotions-metrics">
        <section className="card" aria-label="Estudiantes participantes">
          <h2>Estudiantes participantes</h2>
          <strong className="metric-value">{integer(data.participants ?? 0)}</strong>
          <p className="field-help">Estudiantes distintos en el periodo</p>
        </section>
        <section className="card" aria-label="Registros">
          <h2>Registros</h2>
          <strong className="metric-value">{integer(data.checkins ?? 0)}</strong>
          <p className="field-help">Check-ins emocionales</p>
        </section>
        <section className="card" aria-label="Promedio">
          <h2>Promedio</h2>
          <strong className="metric-value">{emotionState(average, scale)}</strong>
          <p className="field-help">{decimal(average)} en una escala de 1 a 5</p>
        </section>
      </div>
      <Distribution items={data.distribution} />
      <Trend weeks={data.weekly} scale={scale} />
      <Careers items={data.careers} scale={scale} />
    </div>
  );
}

function AccessibleTable(
  { caption, head, rows }: { caption: string; head: string[]; rows: string[][] },
) {
  return (
    <details className="chart-table">
      <summary>Ver como tabla</summary>
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0
                    ? <th key={j} scope="row">{cell}</th>
                    : <td key={j}>{cell}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Distribution({ items }: { items: EmotionDistribution[] }) {
  const total = items.reduce((sum, item) => sum + item.checkins, 0);
  const max = Math.max(1, ...items.map((item) => item.checkins));
  return (
    <section className="card" aria-labelledby="distribution-title">
      <h2 id="distribution-title">Cómo se distribuyen los registros</h2>
      <p className="field-help">Cantidad de registros por emoción, de la más baja a la más alta.</p>
      <ul className="bars" aria-hidden="true">
        {items.map((item) => (
          <li key={item.value}>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track">
              <span
                className={"bar-fill level-" + item.value}
                style={{ width: (item.checkins / max) * 100 + "%" }}
              />
            </span>
            <span className="bar-value">
              {integer(item.checkins)}
              <span className="bar-share">
                {total ? Math.round((item.checkins / total) * 100) : 0} %
              </span>
            </span>
          </li>
        ))}
      </ul>
      <AccessibleTable
        caption="Registros por emoción"
        head={["Emoción", "Registros", "Porcentaje"]}
        rows={items.map((item) => [
          item.label,
          integer(item.checkins),
          (total ? Math.round((item.checkins / total) * 100) : 0) + " %",
        ])}
      />
    </section>
  );
}

const W = 640, H = 240, LEFT = 72, RIGHT = 16, TOP = 24, BOTTOM = 40;
// Con más semanas los estados se encimarían; siguen en el eje, el detalle y la tabla.
const MAX_POINT_LABELS = 8;
function Trend({ weeks, scale }: { weeks: EmotionWeek[]; scale: EmotionDistribution[] }) {
  const [active, setActive] = useState<EmotionWeek | null>(null);
  const step = (W - LEFT - RIGHT) / weeks.length;
  const x = (i: number) => LEFT + step * (i + 0.5);
  const y = (v: number) => TOP + (H - TOP - BOTTOM) * (1 - (v - 1) / 4);
  // Los tramos se cortan en las semanas sin datos: nunca se dibuja un 0 ni se interpola.
  const runs: { x: number; y: number }[][] = [];
  weeks.forEach((w, i) => {
    if (w.average === null) {
      runs.push([]);
      return;
    }
    if (!runs.length) runs.push([]);
    runs[runs.length - 1].push({ x: x(i), y: y(w.average) });
  });
  const labelEvery = Math.ceil(weeks.length / 8);
  return (
    <section className="card" aria-labelledby="trend-title">
      <h2 id="trend-title">Tendencia semanal</h2>
      <p className="field-help">
        Estado promedio por semana (lunes a domingo). Cada punto toma el estado
        más cercano. Las semanas con pocos participantes se muestran en gris,
        sin valor.
      </p>
      <div className="chart-scroll">
        <svg
          className="trend"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Gráfico de línea con el promedio semanal de ${weeks.length} semanas. Hay una tabla equivalente debajo.`}
        >
          {weeks.map((w, i) =>
            w.average === null && (
              <rect
                key={w.weekStart}
                className="gap-band"
                x={x(i) - step / 2 + 2}
                y={TOP}
                width={step - 4}
                height={H - TOP - BOTTOM}
                rx="4"
              />
            )
          )}
          {scale.map((level) => (
            <g key={level.value}>
              <line className="grid-line" x1={LEFT} x2={W - RIGHT} y1={y(level.value)} y2={y(level.value)} />
              <text className="axis-text" x={LEFT - 10} y={y(level.value) + 4} textAnchor="end">{level.label}</text>
            </g>
          ))}
          {weeks.map((w, i) =>
            i % labelEvery === 0 && (
              <text key={w.weekStart} className="axis-text" x={x(i)} y={H - 14} textAnchor="middle">
                {shortDate(w.weekStart)}
              </text>
            )
          )}
          {runs.map((run, i) =>
            run.length > 1 && (
              <polyline
                key={i}
                className="trend-line"
                points={run.map((p) => `${p.x},${p.y}`).join(" ")}
              />
            )
          )}
          {weeks.map((w, i) =>
            w.average !== null && (
              <circle
                key={w.weekStart}
                className="trend-point"
                cx={x(i)}
                cy={y(w.average)}
                r="5"
                tabIndex={0}
                aria-label={`Semana del ${shortDate(w.weekStart)}: ${emotionState(w.average, scale)}, promedio ${decimal(w.average)}`}
                onMouseEnter={() => setActive(w)}
                onFocus={() => setActive(w)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
              >
                <title>
                  {`Semana del ${shortDate(w.weekStart)}: ${emotionState(w.average, scale)} (${decimal(w.average)})`}
                </title>
              </circle>
            )
          )}
          {weeks.length <= MAX_POINT_LABELS && weeks.map((w, i) =>
            w.average !== null && (
              <text
                key={w.weekStart}
                className="point-label"
                x={x(i)}
                y={y(w.average) - 11}
                textAnchor="middle"
              >
                {emotionState(w.average, scale)}
              </text>
            )
          )}
        </svg>
      </div>
      <p className="chart-readout" aria-hidden="true">
        {active && active.average !== null && active.participants !== null
          ? `Semana del ${shortDate(active.weekStart)}: ${emotionState(active.average, scale)} (${decimal(active.average)}) · ${integer(active.participants)} estudiantes`
          : " "}
      </p>
      <p className="legend">
        <span className="legend-line" aria-hidden="true" /> Estado promedio semanal
        <span className="legend-gap" aria-hidden="true" /> Semana sin datos suficientes
      </p>
      <AccessibleTable
        caption="Promedio por semana"
        head={["Semana del", "Estudiantes", "Estado", "Promedio"]}
        rows={weeks.map((w) => [
          shortDate(w.weekStart),
          w.participants === null ? "Sin datos suficientes" : integer(w.participants),
          w.average === null ? "Sin datos suficientes" : emotionState(w.average, scale),
          w.average === null ? "Sin datos suficientes" : decimal(w.average),
        ])}
      />
    </section>
  );
}

function Careers({ items, scale }: { items: EmotionCareer[]; scale: EmotionDistribution[] }) {
  return (
    <section className="card" aria-labelledby="careers-title">
      <h2 id="careers-title">Promedio por carrera</h2>
      {items.length === 0
        ? (
          <p className="field-help">
            El desglose por carrera no se muestra en este periodo para proteger
            a grupos pequeños.
          </p>
        )
        : (
          <>
            <p className="field-help">
              Orden alfabético; no es un ranking. «Otras carreras» reúne
              carreras con pocos estudiantes y a quienes no tienen carrera
              registrada.
            </p>
            <ul className="dots" aria-hidden="true">
              {items.map((career) => (
                <li key={career.name}>
                  <span className="dot-name">{career.name}</span>
                  <span className="dot-track">
                    <span className="dot" style={{ left: ((career.average - 1) / 4) * 100 + "%" }} />
                  </span>
                  <span className="dot-value">
                    {emotionState(career.average, scale)}
                    <span className="dot-number">{decimal(career.average)}</span>
                  </span>
                </li>
              ))}
              <li className="dot-scale">
                <span />
                <span className="dot-scale-labels">
                  <span>{scale[0]?.label}</span>
                  <span>{scale[scale.length - 1]?.label}</span>
                </span>
                <span />
              </li>
            </ul>
            <AccessibleTable
              caption="Promedio por carrera"
              head={["Carrera", "Estudiantes", "Estado", "Promedio"]}
              rows={items.map((c) => [
                c.name,
                integer(c.participants),
                emotionState(c.average, scale),
                decimal(c.average),
              ])}
            />
          </>
        )}
    </section>
  );
}
