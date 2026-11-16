import { Chart, Missing, WIDTH } from "./Chart";
import { linear } from "./scale";

export interface HBarRow {
  label: string;
  value: number | null;
  /** Texto al final de la barra y en el tooltip. */
  text: string;
  color?: string;
}
/** Barras horizontales con etiqueta directa; las filas sin datos van rayadas. */
export function HBars(
  { label, rows, max, color, labelWidth = 120 }: {
    label: string;
    rows: HBarRow[];
    max: number;
    color: string;
    labelWidth?: number;
  },
) {
  const rowH = 30, R = 120;
  const height = rows.length * rowH + 4;
  const x = linear(0, max || 1, labelWidth, WIDTH - R);
  return (
    <Chart height={height} label={label}>
      {(api) =>
        rows.map((r, i) => {
          const top = i * rowH + 4;
          return (
            <g key={r.label}>
              <text className="label" x={labelWidth - 10} y={top + 15} textAnchor="end">{r.label}</text>
              {r.value === null
                ? <Missing x={labelWidth} y={top + 2} width={WIDTH - R - labelWidth} height={18} text="menos de 5 estudiantes" />
                : (
                  <g {...api.mark(x(r.value), top + 11, r.label, [r.text])}>
                    <rect
                      x={labelWidth}
                      y={top + 2}
                      width={Math.max(x(r.value) - labelWidth, 3)}
                      height={18}
                      rx="4"
                      fill={r.color ?? color}
                    />
                    <rect className="hit" x={0} y={top} width={WIDTH} height={rowH} />
                    <text className="value" x={Math.max(x(r.value), labelWidth + 3) + 6} y={top + 15}>{r.text}</text>
                  </g>
                )}
            </g>
          );
        })}
    </Chart>
  );
}
