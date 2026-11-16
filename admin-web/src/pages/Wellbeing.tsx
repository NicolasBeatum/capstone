import { NavLink, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Feedback } from "../components/Feedback";
import { ChartDefs } from "../components/charts/Chart";
import { useWellbeing } from "../application/useWellbeing";
import { shortDate, slugOf, TABS, tabFromSlug } from "../domain/wellbeing";
import type { WellbeingPeriod, WellbeingTab, WellbeingTabData } from "../domain/types";
import { SummaryTab } from "./wellbeing/SummaryTab";
import { ReasonsTab } from "./wellbeing/ReasonsTab";

const PERIODS: WellbeingPeriod[] = [7, 30, 90];

export function Wellbeing() {
  const tab = tabFromSlug(useParams().tab);
  const model = useWellbeing(tab);
  const { data } = model;
  const career = model.careers.find((c) => c.id === model.careerId);
  return (
    <div className="wellbeing">
      <ChartDefs />
      <PageHeader
        title="Bienestar estudiantil"
        description="Cómo se sienten quienes eligieron compartir sus registros de forma anónima."
        action={
          <button className="secondary" disabled={model.loading} onClick={() => void model.reload()}>
            Actualizar
          </button>
        }
      />
      <section className="wb-privacy" aria-label="Alcance de los datos">
        <p>
          <strong>Datos agregados y voluntarios.</strong>{" "}
          Solo estudiantes con «datos anónimos» activo. Todo valor reúne al menos 5 estudiantes;
          lo que no llega aparece rayado. Sin valor diagnóstico.
        </p>
      </section>
      <div className="wb-controls">
        <div className="wb-segmented" role="group" aria-label="Periodo">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={model.days === period ? "on" : ""}
              aria-pressed={model.days === period}
              onClick={() => model.setDays(period)}
            >
              {period} días
            </button>
          ))}
        </div>
        <label className="wb-career">
          <span className="sr-only">Carrera</span>
          <select
            value={model.careerId ?? ""}
            onChange={(e) => model.setCareerId(e.target.value || null)}
          >
            <option value="">Todas las carreras</option>
            {model.careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {data && (
          <span className="wb-range">
            {shortDate(data.from)} – {shortDate(data.to)} {data.to.slice(0, 4)} · comparado con los{" "}
            {data.days} días anteriores
          </span>
        )}
      </div>
      <nav className="wb-tabs" aria-label="Secciones del dashboard">
        {TABS.map((t) => (
          <NavLink key={t.id} to={"/wellbeing/" + t.slug} className={t.id === tab ? "active" : ""} aria-current={t.id === tab ? "page" : undefined}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Feedback error={model.error} />
      {model.error && (
        <button className="secondary" onClick={() => void model.reload()}>Reintentar</button>
      )}
      {model.loading && <p role="status" className="wb-loading">Cargando {TABS.find((t) => t.id === tab)?.label.toLowerCase()}…</p>}
      {data && !data.sufficient && (
        <section className="card wb-empty" role="status" aria-label="Datos insuficientes">
          <h2>Aún no hay datos suficientes</h2>
          <p>
            {career
              ? `En este periodo, ${career.name} no reúne 5 estudiantes que compartan sus registros.`
              : "En este periodo todavía no se reúnen 5 estudiantes que compartan sus registros."}{" "}
            Por eso no se muestra ningún valor parcial. Prueba con un periodo más largo o vuelve más adelante.
          </p>
        </section>
      )}
      {data?.sufficient && <TabView tab={tab} data={data} />}
    </div>
  );
}

function TabView({ tab, data }: { tab: WellbeingTab; data: WellbeingTabData[WellbeingTab] }) {
  if (tab === "summary") return <SummaryTab data={data as WellbeingTabData["summary"]} />;
  if (tab === "reasons") return <ReasonsTab data={data as WellbeingTabData["reasons"]} />;
  return (
    <section className="card" aria-label={slugOf(tab)}>
      <p className="field-help">Esta pestaña se completa en las tareas siguientes.</p>
    </section>
  );
}
