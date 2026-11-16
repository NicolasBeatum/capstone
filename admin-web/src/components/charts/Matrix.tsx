import { Chart, Missing, WIDTH } from "./Chart";
import { percent } from "../../domain/wellbeing";

const shade = (v: number) =>
  v < 8 ? "var(--seq-0)" : v < 15 ? "var(--seq-1)" : v < 22 ? "var(--seq-2)" : v < 30 ? "var(--seq-3)" : "var(--seq-4)";

/** Matriz de porcentajes (fila = 100 %). Una fila sin datos suficientes va rayada entera. */
export function Matrix(
  { label, columns, rows, labelWidth = 110 }: {
    label: string;
    columns: readonly string[];
    rows: { label: string; cells: (number | null)[] }[];
    labelWidth?: number;
  },
) {
  const T = 26, rowH = 30;
  const cw = (WIDTH - labelWidth - 6) / columns.length;
  const height = T + rows.length * rowH + 4;
  return (
    <Chart height={height} label={label}>
      {(api) => (
        <>
          {columns.map((c, j) => (
            <text key={c} className="axis" x={labelWidth + j * cw + cw / 2} y={16} textAnchor="middle">{c}</text>
          ))}
          {rows.map((r, i) => {
            const top = T + i * rowH;
            return (
              <g key={r.label}>
                <text className="label" x={labelWidth - 10} y={top + 19} textAnchor="end">{r.label}</text>
                {r.cells.every((v) => v === null)
                  ? <Missing x={labelWidth + 1} y={top + 1} width={cw * columns.length - 2} height={rowH - 2} text="menos de 5 estudiantes en alguna emoción" />
                  : r.cells.map((v, j) => {
                    const x = labelWidth + j * cw;
                    if (v === null) return <Missing key={j} x={x + 1} y={top + 1} width={cw - 2} height={rowH - 2} />;
                    return (
                      <g key={j} {...api.mark(x + cw / 2, top + rowH / 2, `${r.label} · ${columns[j]}`, [`${percent(v)} de sus check-ins`])}>
                        <rect x={x + 1} y={top + 1} width={cw - 2} height={rowH - 2} rx="4" fill={shade(v)} />
                        <text x={x + cw / 2} y={top + 19} textAnchor="middle" className="value" style={v >= 22 ? { fill: "white" } : undefined}>
                          {percent(Math.round(v))}
                        </text>
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </>
      )}
    </Chart>
  );
}
