import { Chart, Missing, WIDTH } from "./Chart";
import { linear, weekTicks } from "./scale";
import { percent, shortDate } from "../../domain/wellbeing";

/** Barras apiladas al 100 % por semana; la primera categoría va abajo. */
export function StackedBars(
  { label, weeks, rows, names, colors, height = 220 }: {
    label: string;
    weeks: string[];
    rows: (number | null)[][];
    names: readonly string[];
    colors: string[];
    height?: number;
  },
) {
  const L = 40, R = 8, T = 8, B = 26;
  const step = (WIDTH - L - R) / Math.max(weeks.length, 1);
  const y = linear(0, 100, height - B, T);
  const tick = weekTicks(weeks);
  return (
    <Chart height={height} label={label}>
      {(api) => (
        <>
          {[0, 50, 100].map((t) => (
            <g key={t}>
              <line className="grid" x1={L} x2={WIDTH - R} y1={y(t)} y2={y(t)} />
              <text className="axis" x={L - 6} y={y(t) + 4} textAnchor="end">{t} %</text>
            </g>
          ))}
          {weeks.map((w, i) => {
            const row = rows[i];
            const x = L + i * step + 2, width = step - 4;
            const label = tick(i) && (
              <text className="axis" x={x + width / 2} y={height - 6} textAnchor="middle">{tick(i)}</text>
            );
            if (row.some((v) => v === null)) {
              return (
                <g key={w}>
                  <Missing x={x} y={T} width={width} height={height - T - B} />
                  {label}
                </g>
              );
            }
            const total = (row as number[]).reduce((a, b) => a + b, 0) || 1;
            let acc = 0;
            return (
              <g key={w}>
                <g
                  {...api.mark(
                    x + width / 2,
                    T + 20,
                    `Semana del ${shortDate(w)}`,
                    names.map((n, k) => `${n}: ${percent(row[k] as number)}`).reverse(),
                  )}
                >
                  <rect className="hit focus-ring" x={x} y={T} width={width} height={height - T - B} rx="3" />
                  {(row as number[]).map((v, k) => {
                    const top = y(((acc + v) / total) * 100), bottom = y((acc / total) * 100);
                    acc += v;
                    return v > 0 && (
                      <rect key={k} x={x} y={top + 0.5} width={width} height={Math.max(bottom - top - 1, 0)} fill={colors[k]} />
                    );
                  })}
                </g>
                {label}
              </g>
            );
          })}
        </>
      )}
    </Chart>
  );
}
