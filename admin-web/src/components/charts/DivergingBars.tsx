import { Chart, WIDTH } from "./Chart";
import { linear } from "./scale";
import { decimal, moodLabel, MOOD_LABELS } from "../../domain/wellbeing";

/** Promedio del ánimo alrededor de «Neutro» (3): rojo por debajo, azul por encima. */
export function DivergingBars(
  { label, rows, labelWidth = 120 }: { label: string; rows: { label: string; value: number }[]; labelWidth?: number },
) {
  const rowH = 30, R = 40;
  const height = rows.length * rowH + 26;
  const x = linear(1, 5, labelWidth, WIDTH - R);
  return (
    <Chart height={height} label={label}>
      {(api) => (
        <>
          {[1, 2, 3, 4, 5].map((t) => (
            <g key={t}>
              <line className={t === 3 ? "baseline" : "grid"} x1={x(t)} x2={x(t)} y1={0} y2={height - 20} />
              <text className="axis" x={x(t)} y={height - 4} textAnchor="middle">{MOOD_LABELS[t - 1]}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const top = i * rowH + 4;
            const a = Math.min(x(r.value), x(3)), w = Math.abs(x(r.value) - x(3));
            const below = r.value < 3;
            return (
              <g key={r.label}>
                <text className="label" x={labelWidth - 10} y={top + 15} textAnchor="end">{r.label}</text>
                <g {...api.mark(x(r.value), top + 11, r.label, [`Ánimo promedio: ${moodLabel(r.value)} (${decimal(r.value)})`])}>
                  <rect x={a} y={top + 3} width={Math.max(w, 2)} height={16} rx="4" fill={below ? "var(--mood-2)" : "var(--mood-4)"} />
                  <rect className="hit" x={0} y={top} width={WIDTH} height={rowH} />
                  <text className="value" x={below ? a - 6 : a + w + 6} y={top + 15} textAnchor={below ? "end" : "start"}>
                    {decimal(r.value)}
                  </text>
                </g>
              </g>
            );
          })}
        </>
      )}
    </Chart>
  );
}
