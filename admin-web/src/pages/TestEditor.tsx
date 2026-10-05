import { type FormEvent, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTestEditor } from "../application/useTestEditor";
import { Feedback } from "../components/Feedback";
import { TestPreview } from "../components/TestPreview";
import { ProtectedInstrument } from "../components/ProtectedInstrument";
import { TestQuestionEditor } from "../components/TestQuestionEditor";
import { TestResultEditor } from "../components/TestResultEditor";
import { validatePublication } from "../domain/testRules";

const steps = ["Datos del test", "Preguntas", "Resultados", "Revisión"];
export function TestEditor() {
  const { versionId } = useParams();
  const model = useTestEditor(versionId), navigate = useNavigate();
  const [step, setStep] = useState(0),
    [fieldError, setFieldError] = useState("");
  const [confirm, setConfirm] = useState<"publish" | "activation" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { content, source } = model;
  const minimum = content.questions.reduce(
    (sum, q) => sum + Math.min(...q.options.map((o) => o.score)),
    0,
  );
  const maximum = content.questions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
    0,
  );
  const publicationError = validatePublication(content);
  function goTo(next: number) {
    setStep(next);
    setFieldError("");
    setConfirm(null);
    requestAnimationFrame(() => heading.current?.focus());
  }
  if (versionId && source?.versionId !== versionId) {
    return (
      <>
        <Link to="/tests">← Catálogos de tests</Link>
        <h1>Versión del cuestionario</h1>
        <Feedback error={model.error} message="" />
        {model.loading
          ? <p role="status">Cargando versión…</p>
          : (
            <button onClick={() => void model.reload()}>Recargar estado</button>
          )}
      </>
    );
  }
  const editable = !source ||
    source.kind === "custom" && source.publicationStatus === "draft";
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Revisar también los pasos ocultos y mostrar el campo que falta completar.
    const invalid = Array.from(e.currentTarget.elements).find((element) =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) && !element.checkValidity()
    ) as HTMLInputElement | HTMLTextAreaElement | undefined;
    if (invalid) {
      const target = Number(
        invalid.closest<HTMLElement>("[data-step]")?.dataset.step ?? 0,
      );
      setStep(target);
      setFieldError(
        `Completa o corrige el campo «${
          invalid.getAttribute("aria-label") ??
            invalid.labels?.[0]?.textContent?.trim() ?? "requerido"
        }» en ${steps[target]}.`,
      );
      requestAnimationFrame(() => {
        invalid.focus();
        invalid.reportValidity();
      });
      return;
    }
    setFieldError("");
    const result = await model.save();
    if (result && !versionId) navigate("/tests/versions/" + result.versionId);
  }
  async function clone() {
    const result = await model.action("clone");
    if (result) {
      goTo(0);
      navigate("/tests/versions/" + result.versionId);
    }
  }
  function addResult() {
    let number = 1;
    while (content.levels.some((l) => l.key === `resultado_${number}`)) {
      number++;
    }
    const start = content.levels.length
      ? Math.max(...content.levels.map((l) => l.max)) + 1
      : minimum;
    model.setContent({
      ...content,
      levels: [...content.levels, {
        key: `resultado_${number}`,
        label: "",
        content: "",
        min: start,
        max: Math.max(start, maximum),
      }],
    });
  }
  return (
    <>
      <Link to="/tests">← Catálogos de tests</Link>
      <h1>
        {source ? "Versión " + source.version : "Crear cuestionario propio"}
      </h1>
      <Feedback error={model.error || fieldError} message={model.message} />
      {model.loading
        ? <p role="status">Cargando versión…</p>
        : source?.kind === "protected"
        ? (
          <ProtectedInstrument
            version={source}
            busy={model.busy}
            onActivation={() => model.action("activation", !source.active)}
          />
        )
        : (
          <div className="test-builder">
            <p className="editor-intro">
              Crea preguntas con respuestas para elegir. Cada respuesta suma
              puntos y el total determina el mensaje de orientación que recibe
              el alumno.
            </p>
            {source && (
              <p className="editor-status">
                <span className="badge">
                  {source.publicationStatus === "published"
                    ? "Publicado"
                    : "Borrador"}
                </span>{" "}
                {source.active
                  ? "Disponible en el catálogo del backend"
                  : "Sin activar en el catálogo"}
              </p>
            )}
            {!editable && (
              <p className="notice">
                Esta versión está publicada y su contenido está protegido. Para
                cambiar preguntas o resultados, usa «Clonar nueva versión».
              </p>
            )}
            <nav className="editor-steps" aria-label="Pasos para crear el test">
              {steps.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  disabled={model.busy}
                  className={step === i
                    ? "editor-step selected"
                    : "editor-step"}
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => goTo(i)}
                >
                  <span className="step-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  {label}
                </button>
              ))}
            </nav>
            <h2 className="step-heading" ref={heading} tabIndex={-1}>
              Paso {step + 1}: {steps[step]}
            </h2>
            <form
              noValidate
              onChange={() => setFieldError("")}
              onSubmit={(e) => void save(e)}
            >
              <fieldset
                className="editor-fields"
                disabled={!editable || model.busy}
              >
                <legend className="sr-only">Contenido del cuestionario</legend>
                <section
                  hidden={step !== 0}
                  data-step="0"
                  aria-label="Datos del test"
                  className="editor-panel"
                >
                  <p>
                    Define cómo se presenta el cuestionario. Podrás guardar un
                    borrador y completar las preguntas después.
                  </p>
                  <label>
                    Nombre del test
                    <input
                      required
                      maxLength={160}
                      value={content.title}
                      aria-describedby="test-title-help"
                      placeholder="Ej.: Hábitos de descanso durante el semestre"
                      onChange={(e) =>
                        model.setContent({ ...content, title: e.target.value })}
                    />
                  </label>
                  <p id="test-title-help" className="field-help">
                    Un nombre breve que permita entender para qué sirve.
                  </p>
                  <label>
                    Descripción (opcional)
                    <textarea
                      maxLength={5000}
                      value={content.description}
                      aria-describedby="test-description-help"
                      placeholder="Ej.: Reflexiona sobre tus momentos de descanso. Elige una respuesta por pregunta pensando en la última semana."
                      onChange={(e) =>
                        model.setContent({
                          ...content,
                          description: e.target.value,
                        })}
                    />
                  </label>
                  <p id="test-description-help" className="field-help">
                    Cuenta el propósito del test y cómo responderlo. Es el texto
                    de introducción para el alumno.
                  </p>
                </section>
                <section
                  hidden={step !== 1}
                  data-step="1"
                  aria-label="Preguntas"
                  className="editor-panel"
                >
                  <p>
                    Escribe una pregunta y sus posibles respuestas. Asigna
                    puntos a cada respuesta para calcular el resultado final.
                  </p>
                  {!content.questions.length && (
                    <div className="editor-empty">
                      <h3>Empieza con tu primera pregunta</h3>
                      <p>
                        Por ejemplo: «¿Con qué frecuencia te cuesta hacer una
                        pausa?» con respuestas «Nunca», «A veces» y
                        «Frecuentemente».
                      </p>
                    </div>
                  )}
                  {content.questions.map((question, i) => (
                    <TestQuestionEditor
                      key={i}
                      question={question}
                      index={i}
                      onChange={(next) =>
                        model.setContent({
                          ...content,
                          questions: content.questions.map((old, j) =>
                            i === j ? next : old
                          ),
                        })}
                      onRemove={() =>
                        model.setContent({
                          ...content,
                          questions: content.questions.filter((_q, j) =>
                            j !== i
                          ),
                        })}
                    />
                  ))}
                  <button
                    type="button"
                    className="secondary"
                    disabled={content.questions.length >= 100}
                    onClick={() =>
                      model.setContent({
                        ...content,
                        questions: [...content.questions, {
                          text: "",
                          helper: "",
                          options: [{ text: "", score: 0 }, {
                            text: "",
                            score: 1,
                          }],
                        }],
                      })}
                  >
                    Añadir pregunta
                  </button>
                </section>
                <section
                  hidden={step !== 2}
                  data-step="2"
                  aria-label="Resultados"
                  className="editor-panel"
                >
                  <p>
                    Un resultado es el mensaje que aparece al terminar el test,
                    según la suma de puntos. Define un intervalo de puntajes
                    para cada mensaje.
                  </p>
                  <div className="score-explainer">
                    <h3>
                      {content.questions.length
                        ? `Tu test puede sumar entre ${minimum} y ${maximum} puntos`
                        : "Primero define las preguntas y sus puntos"}
                    </h3>
                    <p>
                      Ejemplo: si el total va de 0 a 3, puedes crear «Buen
                      descanso» de 0 a 1 y «Conviene hacer una pausa» de 2 a 3.
                    </p>
                    <p>
                      Cubre todos los puntajes posibles, sin dejar espacios ni
                      repetir un puntaje en dos resultados. Si cambias las
                      respuestas, revisa estos intervalos.
                    </p>
                  </div>
                  {!content.levels.length && (
                    <div className="editor-empty">
                      <h3>¿Qué orientación recibirá el alumno?</h3>
                      <p>
                        Puedes empezar con un solo resultado que cubra todo el
                        puntaje y añadir otros si necesitas mensajes distintos.
                      </p>
                    </div>
                  )}
                  {content.levels.map((result, i) => (
                    <TestResultEditor
                      key={i}
                      result={result}
                      index={i}
                      onChange={(next) =>
                        model.setContent({
                          ...content,
                          levels: content.levels.map((old, j) =>
                            i === j ? next : old
                          ),
                        })}
                      onRemove={() =>
                        model.setContent({
                          ...content,
                          levels: content.levels.filter((_l, j) => j !== i),
                        })}
                    />
                  ))}
                  <button
                    type="button"
                    className="secondary"
                    disabled={content.levels.length >= 100}
                    aria-describedby="add-result-help"
                    onClick={addResult}
                  >
                    Añadir resultado
                  </button>
                  <p id="add-result-help" className="field-help">
                    {content.levels.length > 0 &&
                        content.questions.length > 0 &&
                        Math.max(...content.levels.map((l) => l.max)) >= maximum
                      ? "El último resultado llega al puntaje máximo. Si quieres añadir otro, reduce primero su campo «Hasta» para reservar puntos al siguiente resultado."
                      : "El intervalo se completa con los puntos disponibles. Puedes ajustarlo según el mensaje que quieras mostrar."}
                  </p>
                </section>
              </fieldset>
              <section
                hidden={step !== 3}
                className="editor-review"
                aria-label="Revisión del test"
              >
                <div className="review-summary">
                  <div>
                    <span className="field-help">Preguntas</span>
                    <strong>{content.questions.length}</strong>
                  </div>
                  <div>
                    <span className="field-help">Resultados</span>
                    <strong>{content.levels.length}</strong>
                  </div>
                  <div>
                    <span className="field-help">Puntaje posible</span>
                    <strong>{minimum}–{maximum}</strong>
                  </div>
                </div>
                <p>
                  Prueba las respuestas y comprueba qué mensaje corresponde al
                  puntaje. Esta simulación no guarda respuestas.
                </p>
                {publicationError
                  ? (
                    <p className="notice error">
                      Antes de publicar: {publicationError}
                    </p>
                  )
                  : (
                    <p className="notice">
                      Preguntas y rangos completos. Revisa los textos y prueba
                      distintas respuestas antes de publicar.
                    </p>
                  )}
                <TestPreview key={JSON.stringify(content)} content={content} />
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
                  {step < 3 && (
                    <button
                      type="button"
                      disabled={model.busy}
                      onClick={() => goTo(step + 1)}
                    >
                      Continuar a {steps[step + 1].toLowerCase()}
                    </button>
                  )}
                </div>
                {editable && (
                  <button
                    type="submit"
                    className="secondary"
                    disabled={model.busy}
                  >
                    Guardar borrador
                  </button>
                )}
              </div>
              {editable && (
                <p className="field-help">
                  Guardar conserva el borrador. Para publicarlo, completa las
                  preguntas y resultados, guarda tus cambios y ve a Revisión.
                </p>
              )}
            </form>
            <div className="actions">
              {step !== 3 && (
                <button
                  className="secondary"
                  onClick={() => goTo(3)}
                >
                  Vista previa
                </button>
              )}
              {step === 3 && source?.publicationStatus === "draft" && (
                <button
                  disabled={model.busy}
                  onClick={() => setConfirm("publish")}
                >
                  Publicar versión
                </button>
              )}
              {source?.publicationStatus === "published" && (
                <button
                  disabled={model.busy}
                  onClick={() => setConfirm("activation")}
                >
                  {source.active ? "Desactivar versión" : "Activar versión"}
                </button>
              )}
              {source && (
                <button
                  className="secondary"
                  disabled={model.busy}
                  onClick={() => void clone()}
                >
                  Clonar nueva versión
                </button>
              )}
              <button
                className="secondary"
                disabled={model.busy}
                onClick={() => void model.reload()}
              >
                Recargar estado
              </button>
            </div>
            {step === 3 && (
              <p className="field-help">
                Publicar fija el contenido de esta versión. Activarla es un paso
                posterior para habilitarla en el catálogo del backend.
              </p>
            )}
            {confirm && (
              <section className="card" aria-label="Confirmar operación">
                <h2>
                  {confirm === "publish"
                    ? "Publicar esta versión"
                    : "Cambiar disponibilidad"}
                </h2>
                <p>
                  {confirm === "publish"
                    ? "Las preguntas, respuestas y resultados de esta versión quedarán protegidos. Publicar conserva la versión activa anterior y no activa esta versión."
                    : "Activar reemplaza la versión activa del mismo catálogo; las anteriores se conservan."}
                </p>
                <div className="actions">
                  <button
                    disabled={model.busy}
                    onClick={() =>
                      void model.action(
                        confirm,
                        confirm === "activation" ? !source?.active : undefined,
                      ).then((result) => {
                        if (result) {
                          setConfirm(null);
                        }
                      })}
                  >
                    Confirmar{" "}
                    {confirm === "publish" ? "publicación" : "disponibilidad"}
                  </button>
                  <button
                    className="secondary"
                    disabled={model.busy}
                    onClick={() =>
                      setConfirm(null)}
                  >
                    Volver
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
    </>
  );
}
