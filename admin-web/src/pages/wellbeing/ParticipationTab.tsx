import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTable } from "../../components/charts/ChartTable";
import { Columns } from "../../components/charts/Columns";
import { KpiTile } from "../../components/charts/KpiTile";
import type { WellbeingParticipation } from "../../domain/types";
import { decimal, delta, integer, MISSING, percent, shortDate } from "../../domain/wellbeing";
import { weekTicks } from "../../components/charts/scale";

/** Solo totales: nunca se lista quién comparte o participa. */
export function ParticipationTab({ data }: { data: WellbeingParticipation }) {
  const sharing = data.registered !== null && data.sharingShare !== null
    ? Math.round((data.registered * data.sharingShare) / 100)
    : null;
  const active = data.active.value;
  const steps = [
    { label: "Registrados", value: data.registered, note: data.registered === null ? MISSING : integer(data.registered) },
    { label: "Con datos anónimos activo", value: sharing, note: sharing === null ? MISSING : `${integer(sharing)} · ${percent(data.sharingShare as number)}` },
    {
      label: "Activos en el periodo",
      value: active,
      note: active === null ? MISSING : `${integer(active)}${data.registered ? " · " + percent(Math.round((active / data.registered) * 1000) / 10) : ""}`,
    },
  ];
  const top = data.registered ?? Math.max(1, ...steps.map((s) => s.value ?? 0));
  const weeks = data.weekly.map((w) => w.weekStart);
  const tick = weekTicks(weeks);
  const max = Math.max(10, ...data.weekly.map((w) => w.active ?? 0));
  const ceiling = Math.ceil(max / 10) * 10;
  return (
    <div className="wb-tab">
      <div className="wb-grid wb-kpis">
        <KpiTile label="Estudiantes registrados" value={data.registered === null ? null : integer(data.registered)} note={data.careerId ? "en esta carrera" : "en la app"} />
        <KpiTile label="Comparten datos anónimos" value={data.sharingShare === null ? null : percent(data.sharingShare)} note="de los registrados" />
        <KpiTile
          label="Activos en el periodo"
          value={active === null ? null : integer(active)}
          change={delta(data.active, { higherIsBetter: true })}
          hint="vs. periodo anterior"
          note="con al menos un check-in que cuenta"
        />
        <KpiTile
          label="Check-ins por participante"
          value={data.checkinsPerParticipant.value === null ? null : decimal(data.checkinsPerParticipant.value)}
          change={delta(data.checkinsPerParticipant, { higherIsBetter: true, unit: "decimal" })}
          hint="vs. periodo anterior"
          note={`promedio en ${data.days} días`}
        />
      </div>
      <div className="wb-grid wb-two">
        <ChartCard id="wb-funnel" title="De registrados a activos" subtitle="Cuántos estudiantes llegan a cada paso.">
          <ul className="wb-funnel">
            {steps.map((s, i) => (
              <li key={s.label}>
                <span>{s.label}</span>
                <span className="wb-funnel-track" aria-hidden="true">
                  {s.value === null
                    ? <span className="wb-funnel-missing" />
                    : <span className={"wb-funnel-bar step-" + i} style={{ width: Math.max(2, (s.value / top) * 100) + "%" }} />}
                </span>
                <strong>{s.note}</strong>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard id="wb-active" title="Participantes activos por semana" subtitle="Estudiantes distintos con al menos un check-in que cuenta.">
          <Columns
            label="Participantes activos por semana"
            labels={weeks.map((_, i) => tick(i))}
            titles={weeks.map((w) => "Semana del " + shortDate(w))}
            values={data.weekly.map((w) => w.active)}
            baseline={0}
            domain={[0, ceiling]}
            ticks={[0, ceiling / 2, ceiling]}
            tickFormat={integer}
            valueFormat={(v) => integer(v) + " estudiantes"}
            color={() => "var(--seq-3)"}
            showValues={false}
          />
          <ChartTable
            caption="Participantes activos por semana"
            head={["Semana del", "Estudiantes activos"]}
            rows={data.weekly.map((w) => [shortDate(w.weekStart), w.active === null ? MISSING : integer(w.active)])}
          />
        </ChartCard>
      </div>
    </div>
  );
}
