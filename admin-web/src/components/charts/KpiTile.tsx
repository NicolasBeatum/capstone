import type { Delta } from "../../domain/wellbeing";
import { MISSING } from "../../domain/wellbeing";

const ARROW = { up: "▲", down: "▼", flat: "=" } as const;

/**
 * Métrica principal: valor, detalle y variación respecto al periodo anterior. `hint` acompaña a
 * la variación (solo aparece con ella); `note` se muestra siempre.
 */
export function KpiTile(
  { label, value, detail, change, hint, note }: {
    label: string;
    value: string | null;
    detail?: string;
    change?: Delta | null;
    hint?: string;
    note?: string;
  },
) {
  return (
    <section className="card kpi" aria-label={label}>
      <h2>{label}</h2>
      {value === null
        ? <p className="kpi-value kpi-missing">{MISSING}</p>
        : (
          <p className="kpi-value">
            {value}
            {detail && <small>{detail}</small>}
          </p>
        )}
      {change
        ? (
          <p className={"kpi-delta " + change.tone}>
            <span aria-hidden="true">{ARROW[change.direction]}</span>{" "}
            {change.direction === "flat" ? change.text : (
              <>
                <span className="sr-only">{change.direction === "up" ? "Sube" : "Baja"}</span>
                {change.text}
              </>
            )}
            {hint && <span className="kpi-hint"> {hint}</span>}
          </p>
        )
        : null}
      {note && <p className="kpi-note">{note}</p>}
    </section>
  );
}
