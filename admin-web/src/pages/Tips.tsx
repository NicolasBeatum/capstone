import { type FormEvent, useRef, useState } from "react";
import { useTips } from "../application/useTips";
import { Feedback } from "../components/Feedback";
import {
  TipAudienceEditor,
  tipRuleLabel,
} from "../components/TipAudienceEditor";
import type { Tip, TipContent, TipRule } from "../domain/types";
const empty: TipContent = { title: "", content: "", rules: [] };
const signature = (rules: TipRule[]) =>
  rules.map((r) => JSON.stringify(r)).sort().join("|");
const steps = ["Contenido", "Cuándo se aplica", "Revisión"];
export function Tips() {
  const model = useTips();
  const [form, setForm] = useState<TipContent>(empty),
    [general, setGeneral] = useState(true),
    [step, setStep] = useState(0),
    [localError, setLocalError] = useState(""),
    [confirm, setConfirm] = useState<"publish" | "activation" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function goTo(next: number) {
    setStep(next);
    setLocalError("");
    setConfirm(null);
    requestAnimationFrame(() => heading.current?.focus());
  }
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
    setGeneral(!tip?.rules.length);
    goTo(0);
  }
  function chooseGeneral() {
    setGeneral(true);
    setForm({ ...form, rules: [] });
    setLocalError("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError("");
    const invalid = Array.from(e.currentTarget.elements).find((element) =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) && !element.checkValidity()
    ) as HTMLInputElement | HTMLTextAreaElement | undefined;
    if (invalid || !form.title.trim() || !form.content.trim()) {
      setStep(0);
      setLocalError(
        "Completa el título y el consejo para el alumno antes de guardar.",
      );
      requestAnimationFrame(() => {
        invalid?.focus();
        invalid?.reportValidity();
      });
      return;
    }
    if (!general && !form.rules.length) {
      setStep(1);
      setLocalError(
        "Selecciona al menos un ánimo o un resultado, o elige «General» para guardar un consejo sin condiciones.",
      );
      return;
    }
    if (form.rules.length > 100) {
      setStep(1);
      setLocalError("Usa como máximo cien condiciones.");
      return;
    }
    if (await model.save(form)) goTo(2);
  }
  const dirty = (!general && !form.rules.length) || !!model.source &&
      (form.title !== model.source.title ||
        form.content !== model.source.content ||
        signature(form.rules) !== signature(model.source.rules));
  return (
    <>
      <h1>Tips</h1>
      <p className="editor-intro">
        Escribe consejos prácticos y elige si son generales o si responden a un
        ánimo o un resultado de test.
      </p>
      <Feedback error={localError || model.error} message={model.message} />
      <button
        className="secondary"
        disabled={model.busy}
        onClick={() => edit(null)}
      >
        Nuevo tip
      </button>
      <section className="card test-builder" aria-label="Editor de tip">
        <h2>{model.source ? "Editar tip" : "Crear consejo"}</h2>
        {model.source && (
          <p className="editor-status">
            <span className="badge">
              {model.source.publicationStatus === "published"
                ? "Publicado"
                : "Borrador"}
            </span>
            {model.source.active ? "Activo" : "Inactivo"} ·{" "}
            {general ? "General" : "Personalizado"}
          </p>
        )}
        <nav
          className="editor-steps tip-steps"
          aria-label="Pasos para crear el tip"
        >
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={model.busy}
              className={step === i ? "editor-step selected" : "editor-step"}
              aria-current={step === i ? "step" : undefined}
              onClick={() => goTo(i)}
            >
              <span className="step-number" aria-hidden="true">{i + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        <h2 className="step-heading" ref={heading} tabIndex={-1}>
          Paso {step + 1}: {steps[step]}
        </h2>
        <form
          noValidate
          onChange={() => setLocalError("")}
          onSubmit={(e) => void submit(e)}
        >
          <fieldset className="editor-fields" disabled={model.busy}>
            <legend className="sr-only">
              Contenido y condiciones del consejo
            </legend>
            <section hidden={step !== 0} aria-label="Contenido del consejo">
              <label>
                Título del tip<input
                  required
                  maxLength={160}
                  value={form.title}
                  aria-describedby="tip-title-help"
                  placeholder="Ej.: Haz una pausa breve"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <p id="tip-title-help" className="field-help">
                Un título breve que permita entender la recomendación de un
                vistazo.
              </p>
              <label>
                Consejo para el alumno<textarea
                  required
                  maxLength={5000}
                  value={form.content}
                  aria-describedby="tip-content-help"
                  placeholder="Ej.: Dedica unos minutos a descansar, tomar agua y retomar tus actividades con calma."
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })}
                />
              </label>
              <p id="tip-content-help" className="field-help">
                Este es el mensaje completo del consejo. Usa lenguaje cercano y
                acciones concretas, sin diagnósticos.
              </p>
            </section>
            <section hidden={step !== 1} aria-label="Condiciones del consejo">
              <TipAudienceEditor
                general={general}
                rules={form.rules}
                options={model.options}
                onGeneral={chooseGeneral}
                onPersonalized={() => setGeneral(false)}
                onRules={(rules) => setForm({ ...form, rules })}
              />
            </section>
          </fieldset>
          <section hidden={step !== 2} aria-label="Revisión del consejo">
            <p>Revisa el texto y las condiciones antes de publicar.</p>
            <article
              className="test-preview"
              aria-label="Vista previa del consejo"
            >
              <span className="eyebrow">Así se presenta el consejo</span>
              <h3>{form.title || "Consejo sin título"}</h3>
              <p className="tip-content-preview">
                {form.content || "Escribe el mensaje en el paso Contenido."}
              </p>
              <span className="badge">
                {general ? "General · sin condiciones" : "Personalizado"}
              </span>
            </article>
            <div className="score-explainer tip-summary">
              <h3>Cuándo se aplicaría</h3>
              {general
                ? (
                  <p>
                    No depende del ánimo ni de un test. Es un consejo general.
                  </p>
                )
                : form.rules.length
                ? (
                  <>
                    <p>
                      Cuando se cumpla cualquiera de estas condiciones, una sola
                      vez:
                    </p>
                    <ul>
                      {form.rules.map((r) => (
                        <li key={JSON.stringify(r)}>
                          {tipRuleLabel(r, model.options)}
                        </li>
                      ))}
                    </ul>
                  </>
                )
                : (
                  <p>
                    Falta seleccionar una condición. Vuelve al paso «Cuándo se
                    aplica» o elige «General».
                  </p>
                )}
            </div>
          </section>
          <div className="editor-footer">
            <div className="actions">
              {step > 0 && (
                <button
                  type="button"
                  className="secondary"
                  disabled={model.busy}
                  onClick={() => goTo(step - 1)}
                >
                  Anterior
                </button>
              )}
              {step < 2 && (
                <button
                  type="button"
                  disabled={model.busy}
                  onClick={() => goTo(step + 1)}
                >
                  Continuar a {steps[step + 1].toLowerCase()}
                </button>
              )}
            </div>
            <button type="submit" className="secondary" disabled={model.busy}>
              Guardar tip
            </button>
          </div>
          <p className="field-help">
            Guardar un consejo nuevo crea un borrador. Publicarlo es una acción
            aparte; guarda los cambios antes de publicar.
          </p>
        </form>
        <div className="actions">
          {step === 2 && model.source?.publicationStatus === "draft" && (
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
        {step === 2 && (
          <p className="field-help">
            Aquí se guarda el contenido y sus condiciones. La selección de
            consejos en la app se incorporará en la futura integración.
          </p>
        )}
        {confirm && (
          <section className="card" aria-label="Confirmar tip">
            <h3>
              {confirm === "publish"
                ? "Publicar este consejo"
                : "Cambiar disponibilidad"}
            </h3>
            <p>
              {confirm === "publish"
                ? "El consejo y sus condiciones quedarán publicados en el backend."
                : "Cambiar la disponibilidad conserva el contenido y sus condiciones."}
            </p>
            <div className="actions">
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
                    confirm === "activation"
                      ? !model.source?.active
                      : undefined,
                  ).then((ok) => {
                    if (ok) setConfirm(null);
                  });
                }}
              >
                Confirmar {confirm === "publish"
                  ? "publicación del tip"
                  : "disponibilidad del tip"}
              </button>
              <button
                className="secondary"
                disabled={model.busy}
                onClick={() => setConfirm(null)}
              >
                Volver
              </button>
            </div>
          </section>
        )}
      </section>
      <h2>Consejos guardados</h2>
      {model.loading && <p role="status">Cargando tips…</p>}
      <div className="saved-tip-grid">
        {model.data.map((tip) => (
          <section key={tip.id} className="card" aria-label={tip.title}>
            <span className="badge">
              {tip.rules.length ? "Personalizado" : "General"}
            </span>
            <h3>{tip.title}</h3>
            <p>{tip.content}</p>
            <p className="field-help">
              {tip.publicationStatus === "published" ? "Publicado" : "Borrador"}
              {" "}
              · {tip.active ? "Activo" : "Inactivo"}
              {tip.rules.length > 0
                ? ` · ${tip.rules.length} condiciones`
                : " · Sin condiciones"}
            </p>
            <button
              className="secondary"
              disabled={model.busy}
              onClick={() =>
                edit(tip)}
            >
              Ver o editar tip
            </button>
          </section>
        ))}
      </div>
      {!model.loading && !model.error && !model.data.length && (
        <p>
          No hay tips guardados. Crea el primero con el formulario de arriba.
        </p>
      )}
    </>
  );
}
