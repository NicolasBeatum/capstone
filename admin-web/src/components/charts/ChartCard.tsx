import type { ReactNode } from "react";
import { CHART_INFO, type ChartInfoId } from "../../domain/chartInfo";
import { InfoButton } from "./InfoButton";

/** Tarjeta de un gráfico: título con su botón «i», explicación, leyenda opcional y el gráfico. */
export function ChartCard(
  { id, title, subtitle, legend, children, wide }: {
    id: ChartInfoId;
    title: string;
    subtitle: string;
    legend?: { label: string; color: string; kind?: "swatch" | "line" | "hatch" }[];
    children: ReactNode;
    wide?: boolean;
  },
) {
  return (
    <section className={"card chart-card" + (wide ? " wide" : "")} aria-labelledby={id}>
      <div className="chart-head">
        <h2 id={id}>{title}</h2>
        <InfoButton title={title} info={CHART_INFO[id]} />
      </div>
      <p className="chart-sub">{subtitle}</p>
      {legend && (
        <ul className="chart-legend">
          {legend.map((item) => (
            <li key={item.label}>
              <span
                className={"legend-" + (item.kind ?? "swatch")}
                style={item.kind === "hatch" ? undefined : { background: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}
