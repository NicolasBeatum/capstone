import { Chart, Missing, WIDTH } from "./Chart";
import { linear } from "./scale";

/**
 * Columnas desde una línea base (0 para conteos, «Neutro» para el ánimo). Las columnas sin
 * dato van rayadas.
 */
export function Columns(
  { label, labels, titles, values, baseline, domain, ticks, tickFormat, valueFormat, color, height = 200, showValues = true }: {
    label: string;
    labels: (string | null)[];
    titles: string[];
    values: (number | null)[];
    baseline: number;
    domain: [number, number];
    ticks: number[];
    tickFormat: (v: number) => string;
    valueFormat: (v: number) => string;
    color: (v: number) => string;
    height?: number;
    showValues?: boolean;
  },
) {
  const L = 40, R = 8, T = 14, B = 26;
  const step = (WIDTH - L - R) / Math.max(values.length, 1);
  const y = linear(domain[0], domain[1], height - B, T);
  const bw = Math.min(28, step - 6);
  return (
    <Chart height={height} label={label}>
      {(api) => (
        <>
          {ticks.map((t) => (
            <g key={t}>
              <line className={t === baseline ? "baseline" : "grid"} x1={L} x2={WIDTH - R} y1={y(t)} y2={y(t)} />
              <text className="axis" x={L - 6} y={y(t) + 4} textAnchor="end">{tickFormat(t)}</text>
            </g>
          ))}
          {values.map((v, i) => {
            const cx = L + step * (i + 0.5);
            const tick = labels[i] && <text className="axis" x={cx} y={height - 6} textAnchor="middle">{labels[i]}</text>;
            if (v === null) {
              return (
                <g key={i}>
                  <Missing x={cx - step / 2 + 2} y={T} width={step - 4} height={height - T - B} />
                  {tick}
                </g>
              );
            }
            const clamped = Math.min(domain[1], Math.max(domain[0], v));
            const top = Math.min(y(clamped), y(baseline)), h = Math.abs(y(clamped) - y(baseline));
            const below = v < baseline;
            return (
              <g key={i}>
                <g {...api.mark(cx, top, titles[i], [valueFormat(v)])}>
                  <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(h, 2)} rx="4" fill={color(v)} />
                  <rect className="hit" x={cx - step / 2} y={T} width={step} height={height - T - B} />
                  {showValues && (
                    <text className="value" x={cx} y={below ? top + h + 13 : top - 5} textAnchor="middle">{valueFormat(v)}</text>
                  )}
                </g>
                {tick}
              </g>
            );
          })}
        </>
      )}
    </Chart>
  );
}
