import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTable } from "../../components/charts/ChartTable";
import { KpiTile } from "../../components/charts/KpiTile";
import { LineChart } from "../../components/charts/LineChart";
import { StackedBars } from "../../components/charts/StackedBars";
import { Columns } from "../../components/charts/Columns";
import type { WellbeingSummary } from "../../domain/types";
import {
  decimal,
  delta,
  integer,
  MISSING,
  MOOD_LABELS,
  moodLabel,
  percent,
  shortDate,
  WEEKDAYS,
} from "../../domain/wellbeing";

const MOOD_COLORS = [1, 2, 3, 4, 5].map((v) => `var(--mood-${v})`);
const orMissing = <T,>(v: T | null, format: (v: T) => string) => (v === null ? MISSING : format(v));

export function SummaryTab({ data }: { data: WellbeingSummary }) {
  const weeks = data.weekly.map((w) => w.weekStart);
  const worst = data.weekdays.filter((d) => d.average !== null).sort((a, b) => (a.average ?? 0) - (b.average ?? 0))[0];
  const weekdayValues = data.weekdays.map((d) => d.average);
  // Eje de 2 a 4 alrededor de «Neutro», ampliado con margen si algún día se sale.
  const known = weekdayValues.filter((v): v is number => v !== null);
  const lo = Math.min(2, ...known.map((v) => Math.floor((v - 0.3) * 2) / 2));
  const hi = Math.max(4, ...known.map((v) => Math.ceil((v + 0.3) * 2) / 2));
  return (
    <div className="wb-tab">
      <div className="wb-grid wb-kpis">
        <KpiTile
          label="Participantes"
          value={data.participants.value === null ? null : integer(data.participants.value)}
          change={delta(data.participants, { higherIsBetter: true })}
          hint="vs. periodo anterior"
        />
        <KpiTile
          label="Ánimo promedio"
          value={data.average.value === null ? null : moodLabel(data.average.value)}
          detail={data.average.value === null ? undefined : decimal(data.average.value)}
          change={delta(data.average, { higherIsBetter: true, unit: "decimal" })}
          hint={data.average.previous === null ? undefined : "vs. " + decimal(data.average.previous)}
        />
        <KpiTile
          label="Días difíciles"
          value={data.difficultShare.value === null ? null : percent(data.difficultShare.value)}
          change={delta(data.difficultShare, { higherIsBetter: false, unit: "points" })}
          hint="vs. periodo anterior"
          note="de check-ins Mal o Muy mal"
        />
        <KpiTile
          label="Hicieron el test"
          value={data.testTaken.value === null ? null : integer(data.testTaken.value)}
          change={delta(data.testTaken, { higherIsBetter: null })}
          hint="vs. periodo anterior"
        />
        <KpiTile
          label="Estrés alto"
          value={data.highStressShare.value === null ? null : percent(data.highStressShare.value)}
          change={delta(data.highStressShare, { higherIsBetter: false, unit: "points" })}
          hint="vs. periodo anterior"
          note="de quienes hicieron el test"
        />
      </div>
      <div className="wb-grid wb-two">
        <ChartCard id="wb-trend" title="Ánimo promedio por semana" subtitle="Escala de 1 (Muy mal) a 5 (Muy bien). Semanas con menos de 5 estudiantes quedan rayadas.">
          <LineChart
            label="Ánimo promedio por semana"
            weeks={weeks}
            series={[{ name: "Ánimo", color: "var(--navy)", values: data.weekly.map((w) => w.average) }]}
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormat={(v) => MOOD_LABELS[v - 1]}
            valueFormat={(v) => `${moodLabel(v)} (${decimal(v)})`}
            left={62}
          />
          <ChartTable
            caption="Ánimo promedio por semana"
            head={["Semana del", "Estado", "Promedio"]}
            rows={data.weekly.map((w) => [
              shortDate(w.weekStart),
              orMissing(w.average, moodLabel),
              orMissing(w.average, decimal),
            ])}
          />
        </ChartCard>
        <ChartCard
          id="wb-stack"
          title="Cómo se reparten los registros cada semana"
          subtitle="% de check-ins por emoción. Si alguna emoción tiene menos de 5 estudiantes, la semana completa queda rayada."
          legend={[...MOOD_LABELS.map((label, i) => ({ label, color: MOOD_COLORS[i] })), { label: "Sin datos suficientes", color: "", kind: "hatch" as const }]}
        >
          <StackedBars
            label="Distribución semanal de emociones"
            weeks={weeks}
            rows={data.weekly.map((w) => w.distribution)}
            names={MOOD_LABELS}
            colors={MOOD_COLORS}
          />
          <ChartTable
            caption="Porcentaje de check-ins por emoción y semana"
            head={["Semana del", ...MOOD_LABELS]}
            rows={data.weekly.map((w) => [shortDate(w.weekStart), ...w.distribution.map((v) => orMissing(v, percent))])}
          />
        </ChartCard>
        <ChartCard
          id="wb-weekday"
          title="Ánimo por día de la semana"
          subtitle={worst?.average != null
            ? `Centro en «Neutro». El día con el ánimo más bajo es el ${["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][worst.day - 1]}.`
            : "Centro en «Neutro»."}
        >
          <Columns
            label="Ánimo promedio por día de la semana"
            labels={[...WEEKDAYS]}
            titles={["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]}
            values={weekdayValues}
            baseline={3}
            domain={[lo, hi]}
            ticks={Array.from({ length: Math.round((hi - lo) * 2) + 1 }, (_, i) => lo + i * 0.5)}
            tickFormat={decimal}
            valueFormat={(v) => decimal(v)}
            color={(v) => (v < 3 ? "var(--mood-2)" : "var(--mood-4)")}
          />
          <ChartTable
            caption="Ánimo promedio por día de la semana"
            head={["Día", "Estado", "Promedio"]}
            rows={data.weekdays.map((d) => [
              ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][d.day - 1],
              orMissing(d.average, moodLabel),
              orMissing(d.average, decimal),
            ])}
          />
        </ChartCard>
        <ChartCard id="wb-top" title="Lo más mencionado" subtitle="Motivos con más check-ins en el periodo">
          {data.topReasons.length === 0
            ? <p className="field-help">Ningún motivo reúne 5 estudiantes en este periodo.</p>
            : (
              <ol className="wb-top">
                {data.topReasons.map((r, i) => (
                  <li key={r.name}>
                    <span className="wb-rank" aria-hidden="true">{i + 1}</span>
                    <span>{r.name}</span>
                    <strong>{percent(r.share)}</strong>
                  </li>
                ))}
              </ol>
            )}
          <p className="field-help">Un check-in puede tener varios motivos; los porcentajes no suman 100.</p>
        </ChartCard>
      </div>
    </div>
  );
}
