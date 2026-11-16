import { ChartCard } from "../../components/charts/ChartCard";
import { ChartTable } from "../../components/charts/ChartTable";
import { HBars } from "../../components/charts/HBars";
import { DivergingBars } from "../../components/charts/DivergingBars";
import { Matrix } from "../../components/charts/Matrix";
import { LineChart } from "../../components/charts/LineChart";
import type { WellbeingReasons } from "../../domain/types";
import { decimal, MISSING, MOOD_LABELS, moodLabel, percent, percentCeiling, shortDate } from "../../domain/wellbeing";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

export function ReasonsTab({ data }: { data: WellbeingReasons }) {
  if (data.ranking.length === 0) {
    return (
      <section className="card wb-empty" role="status">
        <h2>Ningún motivo reúne 5 estudiantes</h2>
        <p>En este periodo los motivos se mencionan en grupos demasiado pequeños para mostrarlos.</p>
      </section>
    );
  }
  const max = percentCeiling(data.ranking.map((r) => r.share));
  const byMood = [...data.ranking].sort((a, b) => a.average - b.average);
  const weeks = data.trend[0]?.weeks.map((w) => w.weekStart) ?? [];
  const trendMax = percentCeiling(data.trend.flatMap((t) => t.weeks.map((w) => w.share)));
  return (
    <div className="wb-tab">
      <div className="wb-grid wb-two">
        <ChartCard id="wb-ranking" title="Motivos más frecuentes" subtitle="% de check-ins que mencionan cada motivo. Un check-in puede tener varios.">
          <HBars
            label="Motivos más frecuentes"
            rows={data.ranking.map((r) => ({ label: r.name, value: r.share, text: percent(r.share) }))}
            max={max}
            color="var(--series-1)"
          />
          <ChartTable
            caption="Motivos más frecuentes"
            head={["Motivo", "% de check-ins"]}
            rows={data.ranking.map((r) => [r.name, percent(r.share)])}
          />
        </ChartCard>
        <ChartCard id="wb-diverging" title="Ánimo promedio según el motivo" subtitle="Qué motivos acompañan los días malos (centro = Neutro).">
          <DivergingBars label="Ánimo promedio según el motivo" rows={byMood.map((r) => ({ label: r.name, value: r.average }))} />
          <ChartTable
            caption="Ánimo promedio según el motivo"
            head={["Motivo", "Estado", "Promedio"]}
            rows={byMood.map((r) => [r.name, moodLabel(r.average), decimal(r.average)])}
          />
        </ChartCard>
        <ChartCard
          id="wb-matrix"
          title="Emociones dentro de cada motivo"
          subtitle="% de cada emoción entre los check-ins con ese motivo. Si una emoción tiene menos de 5 estudiantes, la fila queda rayada."
        >
          <Matrix label="Emociones dentro de cada motivo" columns={MOOD_LABELS} rows={data.matrix.map((r) => ({ label: r.name, cells: r.cells }))} />
          <ChartTable
            caption="Porcentaje de cada emoción por motivo"
            head={["Motivo", ...MOOD_LABELS]}
            rows={data.matrix.map((r) => [r.name, ...r.cells.map((v) => (v === null ? MISSING : percent(v)))])}
          />
        </ChartCard>
        <ChartCard
          id="wb-reason-trend"
          title={`Evolución de los ${data.trend.length} motivos principales`}
          subtitle="% de check-ins por semana que mencionan cada motivo."
          legend={data.trend.map((t, i) => ({ label: t.name, color: SERIES[i], kind: "line" as const }))}
        >
          <LineChart
            label="Evolución semanal de los motivos principales"
            weeks={weeks}
            series={data.trend.map((t, i) => ({ name: t.name, color: SERIES[i], values: t.weeks.map((w) => w.share) }))}
            domain={[0, trendMax]}
            ticks={[0, trendMax / 2, trendMax]}
            tickFormat={(v) => percent(v)}
            valueFormat={percent}
            endLabels
          />
          <ChartTable
            caption="Porcentaje semanal de los motivos principales"
            head={["Semana del", ...data.trend.map((t) => t.name)]}
            rows={weeks.map((w, i) => [shortDate(w), ...data.trend.map((t) => (t.weeks[i].share === null ? MISSING : percent(t.weeks[i].share as number)))])}
          />
        </ChartCard>
      </div>
    </div>
  );
}
