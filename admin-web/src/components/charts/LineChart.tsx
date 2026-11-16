import { Chart, Missing, WIDTH } from "./Chart";
import { linear, weekTicks } from "./scale";
import { shortDate } from "../../domain/wellbeing";

export interface LineSeries {
  name: string;
  color: string;
  values: (number | null)[];
}
/**
 * Línea semanal. Las semanas sin dato cortan la línea (nunca se interpola ni se dibuja 0); si
 * ninguna serie tiene dato esa semana, la columna va rayada.
 */
export function LineChart(
  { label, weeks, series, domain, ticks, tickFormat, valueFormat, height = 220, left = 40, endLabels = false }: {
    label: string;
    weeks: string[];
    series: LineSeries[];
    domain: [number, number];
    ticks: number[];
    tickFormat: (v: number) => string;
    valueFormat: (v: number) => string;
    height?: number;
    left?: number;
    endLabels?: boolean;
  },
) {
  const T = 12, B = 26, R = endLabels ? 84 : 14;
  const step = (WIDTH - left - R) / Math.max(weeks.length, 1);
  const x = (i: number) => left + step * (i + 0.5);
  const y = linear(domain[0], domain[1], height - B, T);
  const tick = weekTicks(weeks);
  // Etiquetas al final de cada línea, separadas al menos 13 px para que no se encimen.
  const ends = new Map<string, number>();
  if (endLabels) {
    const placed = series
      .map((s) => ({ name: s.name, v: s.values.filter((v): v is number => v !== null).at(-1) }))
      .filter((e): e is { name: string; v: number } => e.v !== undefined)
      .map((e) => ({ name: e.name, y: y(e.v) + 4 }))
      .sort((a, b) => a.y - b.y);
    placed.forEach((e, i) => {
      if (i > 0 && e.y - placed[i - 1].y < 13) e.y = placed[i - 1].y + 13;
      ends.set(e.name, e.y);
    });
  }
  return (
    <Chart height={height} label={label}>
      {(api) => (
        <>
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={left} x2={WIDTH - R} y1={y(t)} y2={y(t)} />
              <text className="axis" x={left - 6} y={y(t) + 4} textAnchor="end">{tickFormat(t)}</text>
            </g>
          ))}
          {weeks.map((w, i) => (
            <g key={w}>
              {series.every((s) => s.values[i] === null) && (
                <Missing x={x(i) - step / 2 + 2} y={T} width={step - 4} height={height - T - B} />
              )}
              {tick(i) && <text className="axis" x={x(i)} y={height - 6} textAnchor="middle">{tick(i)}</text>}
            </g>
          ))}
          {series.map((s) => {
            let d = "", pen = false;
            s.values.forEach((v, i) => {
              if (v === null) return void (pen = false);
              d += (pen ? "L" : "M") + x(i) + " " + y(v);
              pen = true;
            });
            const last = s.values.map((v, i) => [v, i] as const).filter(([v]) => v !== null).at(-1);
            return (
              <g key={s.name}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {s.values.map((v, i) =>
                  v !== null && (
                    <g key={i} {...api.mark(x(i), y(v), `Semana del ${shortDate(weeks[i])}`, [`${s.name}: ${valueFormat(v)}`])}>
                      <circle cx={x(i)} cy={y(v)} r="4" fill={s.color} stroke="white" strokeWidth="2" />
                      <circle className="hit" cx={x(i)} cy={y(v)} r="10" />
                    </g>
                  )
                )}
                {endLabels && last && (
                  <text className="label" x={x(last[1]) + 8} y={ends.get(s.name)} fill={s.color}>{s.name}</text>
                )}
              </g>
            );
          })}
        </>
      )}
    </Chart>
  );
}
