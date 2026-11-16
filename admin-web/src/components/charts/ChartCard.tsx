import type { ReactNode } from "react";

/** Tarjeta de un gráfico: título, explicación, leyenda opcional y el gráfico. */
export function ChartCard(
  { id, title, subtitle, legend, children, wide }: {
    id: string;
    title: string;
    subtitle: string;
    legend?: { label: string; color: string; kind?: "swatch" | "line" | "hatch" }[];
    children: ReactNode;
    wide?: boolean;
  },
) {
  return (
    <section className={"card chart-card" + (wide ? " wide" : "")} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
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
