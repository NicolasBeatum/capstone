import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTable } from "../../components/charts/ChartTable";
import { HBars } from "../../components/charts/HBars";
import { KpiTile } from "../../components/charts/KpiTile";
import { LineChart } from "../../components/charts/LineChart";
import type { WellbeingStress } from "../../domain/types";
import { decimal, delta, integer, MISSING, percent, percentCeiling, shortDate } from "../../domain/wellbeing";

const LEVEL_COLORS = ["var(--stress-1)", "var(--stress-2)", "var(--stress-3)"];

export function StressTab({ data }: { data: WellbeingStress }) {
  const takers = data.participants.value;
  const levelTotal = data.levels.reduce((sum, l) => sum + (l.students ?? 0), 0);
  const levelMax = Math.max(5, ...data.levels.map((l) => l.students ?? 0));
  const weeks = data.weekly.map((w) => w.weekStart);
  const weeklyMax = percentCeiling(data.weekly.map((w) => w.highShare));
  const careerMax = percentCeiling(data.careers.map((c) => c.highShare));
  const high = data.levels.at(-1)?.label.toLowerCase() ?? "nivel alto";
  return (
    <div className="wb-tab">
      <div className="wb-grid wb-kpis">
        <KpiTile
          label="Estudiantes con test"
          value={takers === null ? null : integer(takers)}
          change={delta(data.participants, { higherIsBetter: null })}
          hint="vs. periodo anterior"
          note="último test de cada uno en el periodo"
        />
        <KpiTile
          label="Puntaje promedio"
          value={data.average.value === null ? null : decimal(data.average.value)}
          detail="de 40"
          change={delta(data.average, { higherIsBetter: false, unit: "decimal" })}
          hint="vs. periodo anterior"
        />
        <KpiTile
          label="Estrés alto"
          value={data.highShare.value === null ? null : percent(data.highShare.value)}
          change={delta(data.highShare, { higherIsBetter: false, unit: "points" })}
          hint="vs. periodo anterior"
          note={`en ${high}`}
        />
      </div>
      {takers === null && (
        <p className="notice" role="status">
          Menos de 5 estudiantes hicieron el test en este periodo: no se muestran sus resultados.
        </p>
      )}
      <div className="wb-grid wb-two">
        <ChartCard
          id="wb-levels"
          title="Distribución por nivel"
          subtitle="Estudiantes según su último resultado. Si un nivel tiene menos de 5, se ocultan todos."
        >
          <HBars
            label="Estudiantes por nivel de estrés"
            rows={data.levels.map((l, i) => ({
              label: l.label,
              value: l.students,
              color: LEVEL_COLORS[Math.min(i, LEVEL_COLORS.length - 1)],
              text: l.students === null ? MISSING : `${integer(l.students)} · ${percent(Math.round((l.students / (levelTotal || 1)) * 1000) / 10)}`,
            }))}
            max={levelMax}
            color="var(--stress-2)"
          />
          <ChartTable
            caption="Estudiantes por nivel de estrés"
            head={["Nivel", "Estudiantes"]}
            rows={data.levels.map((l) => [l.label, l.students === null ? MISSING : integer(l.students)])}
          />
        </ChartCard>
        <ChartCard
          id="wb-stress-weekly"
          title="% con estrés alto por semana"
          subtitle="Último test de cada estudiante en la semana. Semanas con menos de 5 tests quedan rayadas."
        >
          <LineChart
            label="Porcentaje con estrés alto por semana"
            weeks={weeks}
            series={[{ name: "Estrés alto", color: "var(--stress-3)", values: data.weekly.map((w) => w.highShare) }]}
            domain={[0, weeklyMax]}
            ticks={[0, weeklyMax / 2, weeklyMax]}
            tickFormat={(v) => percent(v)}
            valueFormat={percent}
          />
          <ChartTable
            caption="Estrés por semana"
            head={["Semana del", "Puntaje promedio", "% estrés alto"]}
            rows={data.weekly.map((w) => [
              shortDate(w.weekStart),
              w.average === null ? MISSING : decimal(w.average),
              w.highShare === null ? MISSING : percent(w.highShare),
            ])}
          />
        </ChartCard>
        <ChartCard id="wb-stress-careers" title="Estrés alto por carrera" subtitle="Orden alfabético; no es un ranking. «Otras carreras» reúne las carreras con pocos estudiantes." wide>
          {data.careers.length === 0
            ? <p className="field-help">El desglose por carrera no se muestra en este periodo para proteger a grupos pequeños.</p>
            : (
              <div className="wb-narrow">
                <HBars
                  label="Porcentaje con estrés alto por carrera"
                  rows={data.careers.map((c) => ({
                    label: c.name,
                    value: c.highShare,
                    text: c.highShare === null ? MISSING : `${percent(c.highShare)} · promedio ${decimal(c.average as number)}`,
                  }))}
                  max={careerMax}
                  color="var(--stress-3)"
                  labelWidth={210}
                />
              </div>
            )}
          <ChartTable
            caption="Estrés por carrera"
            head={["Carrera", "Puntaje promedio", "% estrés alto"]}
            rows={data.careers.map((c) => [
              c.name,
              c.average === null ? MISSING : decimal(c.average),
              c.highShare === null ? MISSING : percent(c.highShare),
            ])}
          />
        </ChartCard>
      </div>
    </div>
  );
}
