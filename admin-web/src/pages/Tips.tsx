import { type FormEvent, useState } from "react";
import { useTips } from "../application/useTips";
import { Feedback } from "../components/Feedback";
import type { Tip, TipContent, TipRule } from "../domain/types";
const empty: TipContent = { title: "", content: "", rules: [] };
const signature = (rules: TipRule[]) =>
  rules.map((r) => JSON.stringify(r)).sort().join("|");
export function Tips() {
  const model = useTips();
  const [form, setForm] = useState<TipContent>(empty),
    [resultIndex, setResultIndex] = useState(""),
    [localError, setLocalError] = useState(""),
    [confirm, setConfirm] = useState<"publish" | "activation" | null>(null);
  function edit(tip: Tip | null) {
    model.select(tip);
    setForm(
      tip
        ? {
          title: tip.title,
          content: tip.content,
          rules: tip.rules.map((r) => ({ ...r })),
        }
        : empty,
    );
    setResultIndex("");
    setLocalError("");
    setConfirm(null);
  }
  function mood(mood: string, enabled: boolean) {
    setForm({
      ...form,
      rules: enabled
        ? [...form.rules, { kind: "mood", mood }]
        : form.rules.filter((r) => r.kind !== "mood" || r.mood !== mood),
    });
  }
  function addResult() {
    const level = model.options?.resultLevels[Number(resultIndex)];
    if (!level || resultIndex === "") return;
    const rule: TipRule = {
      kind: "result",
      catalogId: level.catalogId,
      versionId: level.versionId,
      version: level.version,
      level: level.level,
    };
    if (form.rules.some((r) => JSON.stringify(r) === JSON.stringify(rule))) {
      setLocalError("Esa regla ya está asociada.");
      return;
    }
    setForm({ ...form, rules: [...form.rules, rule] });
    setResultIndex("");
    setLocalError("");
  }
  function ruleLabel(rule: TipRule) {
    if (rule.kind === "mood") return "Ánimo: " + rule.mood;
    const level = model.options?.resultLevels.find((l) =>
      l.catalogId === rule.catalogId && l.versionId === rule.versionId &&
      l.level === rule.level
    );
    return `${level?.title ?? "Test"} · versión ${rule.version} · ${
      level?.label || rule.level
    }${level && !level.active ? " · versión inactiva" : ""}`;
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (form.rules.length > 100) {
      setLocalError("Usa como máximo cien reglas.");
      return;
    }
    await model.save(form);
  }
  const dirty = !!model.source &&
    (form.title !== model.source.title ||
      form.content !== model.source.content ||
      signature(form.rules) !== signature(model.source.rules));
  return (
    <>
      <h1>Tips</h1>
      <p className="muted">
        Consejos de orientación no diagnóstica. Las reglas expresan
        alternativas; su selección en Android se implementará posteriormente.
      </p>
      <Feedback error={localError || model.error} message={model.message} />
      <button
        className="secondary"
        disabled={model.busy}
        onClick={() => edit(null)}
      >
        Nuevo tip
      </button>
      <section className="card" aria-label="Editor de tip">
        <h2>{model.source ? "Editar tip" : "Crear consejo"}</h2>
        {model.source && (
          <p>
            {model.source.publicationStatus === "published"
              ? "Publicado"
              : "Borrador"} · {model.source.active ? "Activo" : "Inactivo"}{" "}
            · Revisión {model.source.revision}
          </p>
        )}
        <form onSubmit={(e) => void submit(e)}>
          <fieldset disabled={model.busy}>
            <legend>Contenido y reglas</legend>
            <label>
              Título del tip<input
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Contenido del tip<textarea
                required
                maxLength={5000}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </label>
            <h3>Reglas por ánimo</h3>
            {model.options?.moods.map((m) => (
              <label key={m} className="inline">
                <input
                  type="checkbox"
                  checked={form.rules.some((r) =>
                    r.kind === "mood" && r.mood === m
                  )}
                  onChange={(e) => mood(m, e.target.checked)}
                />
                {m}
              </label>
            ))}
            <label>
              Nivel de resultado<select
                value={resultIndex}
                onChange={(e) => setResultIndex(e.target.value)}
              >
                <option value="">Elige catálogo, versión y nivel</option>
                {model.options?.resultLevels.map((l, i) => (
                  <option value={i} key={l.versionId + ":" + l.level}>
                    {l.title} · v{l.version} · {l.label || l.level}
                    {l.active ? "" : " · inactiva"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="secondary"
              disabled={resultIndex === ""}
              onClick={addResult}
            >
              Añadir regla de resultado
            </button>
            <h3>
              {form.rules.length ? "Reglas asociadas (OR)" : "Consejo general"}
            </h3>
            {!form.rules.length && <p>Sin reglas, este consejo es general.</p>}
            <ul>
              {form.rules.map((r, i) => (
                <li key={JSON.stringify(r)}>
                  {ruleLabel(r)}{" "}
                  <button
                    type="button"
                    className="secondary"
                    aria-label={"Quitar regla " + (i + 1)}
                    onClick={() =>
                      setForm({
                        ...form,
                        rules: form.rules.filter((_r, j) => j !== i),
                      })}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <button disabled={model.busy}>Guardar tip</button>
          </fieldset>
        </form>
        <div className="actions">
          {model.source?.publicationStatus === "draft" && (
            <button
              disabled={model.busy}
              onClick={() => {
                if (dirty) {
                  setLocalError("Guarda los cambios antes de publicar.");
                } else setConfirm("publish");
              }}
            >
              Publicar tip
            </button>
          )}
          {model.source?.publicationStatus === "published" && (
            <button
              disabled={model.busy}
              onClick={() => setConfirm("activation")}
            >
              {model.source.active ? "Desactivar tip" : "Activar tip"}
            </button>
          )}
          <button
            className="secondary"
            disabled={model.busy}
            onClick={() =>
              void model.reload().then((tip) => {
                if (tip) edit(tip);
              })}
          >
            Recargar estado del tip
          </button>
        </div>
        {confirm && (
          <section aria-label="Confirmar tip">
            <p>
              {confirm === "publish"
                ? "Publicar hace disponible el consejo y sus reglas en el backend."
                : "Cambiar la disponibilidad conserva el contenido y sus reglas."}
            </p>
            <button
              disabled={model.busy}
              onClick={() => {
                if (dirty) {
                  setLocalError(
                    "Guarda los cambios antes de cambiar la disponibilidad.",
                  );
                  return;
                }
                void model.action(
                  confirm,
                  confirm === "activation" ? !model.source?.active : undefined,
                ).then((ok) => {
                  if (ok) setConfirm(null);
                });
              }}
            >
              Confirmar {confirm === "publish"
                ? "publicación del tip"
                : "disponibilidad del tip"}
            </button>{" "}
            <button
              className="secondary"
              disabled={model.busy}
              onClick={() => setConfirm(null)}
            >
              Volver
            </button>
          </section>
        )}
      </section>
      {model.loading && <p role="status">Cargando tips…</p>}
      {model.data.map((t) => (
        <section key={t.id} className="card" aria-label={t.title}>
          <h2>{t.title}</h2>
          <p>{t.content}</p>
          <p>
            {t.publicationStatus === "published" ? "Publicado" : "Borrador"} ·
            {" "}
            {t.active ? "Activo" : "Inactivo"} ·{" "}
            {t.rules.length ? "Con reglas" : "General"}
          </p>
          <button
            className="secondary"
            disabled={model.busy}
            onClick={() =>
              edit(t)}
          >
            Ver o editar tip
          </button>
        </section>
      ))}
      {!model.loading && !model.data.length && <p>No hay tips.</p>}
    </>
  );
}
