import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTestEditor } from "../application/useTestEditor";
import { Feedback } from "../components/Feedback";
import { TestPreview } from "../components/TestPreview";
import { ProtectedInstrument } from "../components/ProtectedInstrument";
import type { Question, ResultLevel } from "../domain/types";
export function TestEditor() {
  const { versionId } = useParams();
  const model = useTestEditor(versionId), navigate = useNavigate();
  const [preview, setPreview] = useState(false),
    [confirm, setConfirm] = useState<"publish" | "activation" | null>(null);
  const { content, source } = model;
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
  function setQuestion(i: number, q: Question) {
    model.setContent({
      ...content,
      questions: content.questions.map((old, j) => i === j ? q : old),
    });
  }
  function setLevel(i: number, l: ResultLevel) {
    model.setContent({
      ...content,
      levels: content.levels.map((old, j) => i === j ? l : old),
    });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const result = await model.save();
    if (result && !versionId) navigate("/tests/versions/" + result.versionId);
  }
  async function clone() {
    const result = await model.action("clone");
    if (result) navigate("/tests/versions/" + result.versionId);
  }
  return (
    <>
      <Link to="/tests">← Catálogos de tests</Link>
      <h1>
        {source ? "Versión " + source.version : "Crear cuestionario propio"}
      </h1>
      <Feedback error={model.error} message={model.message} />
      {model.loading ? <p role="status">Cargando versión…</p> : (
        <>
          {source && (
            <p>
              {source.publicationStatus === "published"
                ? "Publicado"
                : "Borrador"} · {source.active ? "Activo" : "Inactivo"}{" "}
              · Revisión {source.revision} · {source.kind === "protected"
                ? "Instrumento protegido"
                : "Cuestionario propio"}
            </p>
          )}
          {source?.kind === "protected"
            ? (
              <ProtectedInstrument
                version={source}
                busy={model.busy}
                onActivation={() => model.action("activation", !source.active)}
              />
            )
            : (
              <>
                <form onSubmit={(e) => void save(e)}>
                  <fieldset disabled={!editable || model.busy}>
                    <legend>Contenido del cuestionario</legend>
                    <label>
                      Título<input
                        required
                        maxLength={160}
                        value={content.title}
                        onChange={(e) =>
                          model.setContent({
                            ...content,
                            title: e.target.value,
                          })}
                      />
                    </label>
                    <label>
                      Descripción<textarea
                        maxLength={5000}
                        value={content.description}
                        onChange={(e) =>
                          model.setContent({
                            ...content,
                            description: e.target.value,
                          })}
                      />
                    </label>
                    {content.questions.map((q, i) => (
                      <fieldset key={i}>
                        <legend>Pregunta {i + 1}</legend>
                        <label>
                          Texto de pregunta {i + 1}
                          <textarea
                            required
                            maxLength={5000}
                            value={q.text}
                            onChange={(e) =>
                              setQuestion(i, { ...q, text: e.target.value })}
                          />
                        </label>
                        <label>
                          Ayuda de pregunta {i + 1}
                          <textarea
                            maxLength={5000}
                            value={q.helper}
                            onChange={(e) =>
                              setQuestion(i, { ...q, helper: e.target.value })}
                          />
                        </label>
                        {q.options.map((o, j) => (
                          <div className="row" key={j}>
                            <label>
                              Opción {j + 1} de pregunta {i + 1}
                              <input
                                required
                                maxLength={160}
                                value={o.text}
                                onChange={(e) =>
                                  setQuestion(i, {
                                    ...q,
                                    options: q.options.map((old, k) =>
                                      k === j
                                        ? { ...old, text: e.target.value }
                                        : old
                                    ),
                                  })}
                              />
                            </label>
                            <label>
                              Puntaje {j + 1} de pregunta {i + 1}
                              <input
                                type="number"
                                min={0}
                                max={1000}
                                required
                                value={o.score}
                                onChange={(e) =>
                                  setQuestion(i, {
                                    ...q,
                                    options: q.options.map((old, k) =>
                                      k === j
                                        ? {
                                          ...old,
                                          score: Number(e.target.value),
                                        }
                                        : old
                                    ),
                                  })}
                              />
                            </label>
                            <button
                              type="button"
                              className="secondary"
                              disabled={q.options.length <= 2}
                              onClick={() =>
                                setQuestion(i, {
                                  ...q,
                                  options: q.options.filter((_o, k) => k !== j),
                                })}
                              aria-label={"Quitar opción " + (j + 1) +
                                " de pregunta " + (i + 1)}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary"
                            disabled={q.options.length >= 20}
                            onClick={() =>
                              setQuestion(i, {
                                ...q,
                                options: [...q.options, {
                                  text: "",
                                  score: q.options.length,
                                }],
                              })}
                          >
                            Añadir opción a pregunta {i + 1}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              model.setContent({
                                ...content,
                                questions: content.questions.filter((_q, j) =>
                                  j !== i
                                ),
                              })}
                          >
                            Quitar pregunta {i + 1}
                          </button>
                        </div>
                      </fieldset>
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
                    {content.levels.map((l, i) => (
                      <fieldset key={i}>
                        <legend>Nivel {i + 1}</legend>
                        <div className="grid">
                          <label>
                            Clave del nivel {i + 1}
                            <input
                              required
                              pattern="[a-z][a-z0-9_]*"
                              maxLength={80}
                              value={l.key}
                              onChange={(e) =>
                                setLevel(i, { ...l, key: e.target.value })}
                            />
                          </label>
                          <label>
                            Etiqueta del nivel {i + 1}
                            <input
                              required
                              maxLength={160}
                              value={l.label}
                              onChange={(e) =>
                                setLevel(i, { ...l, label: e.target.value })}
                            />
                          </label>
                          <label>
                            Mínimo del nivel {i + 1}
                            <input
                              required
                              type="number"
                              min={0}
                              max={100000}
                              value={l.min}
                              onChange={(e) =>
                                setLevel(i, {
                                  ...l,
                                  min: Number(e.target.value),
                                })}
                            />
                          </label>
                          <label>
                            Máximo del nivel {i + 1}
                            <input
                              required
                              type="number"
                              min={0}
                              max={100000}
                              value={l.max}
                              onChange={(e) =>
                                setLevel(i, {
                                  ...l,
                                  max: Number(e.target.value),
                                })}
                            />
                          </label>
                        </div>
                        <label>
                          Orientación del nivel {i + 1}
                          <textarea
                            required
                            maxLength={5000}
                            value={l.content}
                            onChange={(e) =>
                              setLevel(i, { ...l, content: e.target.value })}
                          />
                        </label>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            model.setContent({
                              ...content,
                              levels: content.levels.filter((_l, j) => j !== i),
                            })}
                        >
                          Quitar nivel {i + 1}
                        </button>
                      </fieldset>
                    ))}
                    <button
                      type="button"
                      className="secondary"
                      disabled={content.levels.length >= 100}
                      onClick={() =>
                        model.setContent({
                          ...content,
                          levels: [...content.levels, {
                            key: "",
                            label: "",
                            content: "",
                            min: 0,
                            max: 0,
                          }],
                        })}
                    >
                      Añadir nivel
                    </button>
                  </fieldset>
                  {editable && (
                    <button disabled={model.busy}>Guardar borrador</button>
                  )}
                </form>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      setPreview(!preview)}
                  >
                    {preview ? "Cerrar vista previa" : "Vista previa"}
                  </button>
                  {source?.publicationStatus === "draft" && (
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
                {confirm && (
                  <section className="card" aria-label="Confirmar operación">
                    <h2>
                      {confirm === "publish"
                        ? "Publicar esta versión"
                        : "Cambiar disponibilidad"}
                    </h2>
                    <p>
                      {confirm === "publish"
                        ? "Se congelará el contenido. Publicar conserva la versión activa anterior y no activa esta versión."
                        : "Activar reemplaza la versión activa del mismo catálogo; las anteriores se conservan."}
                    </p>
                    <button
                      disabled={model.busy}
                      onClick={() =>
                        void model.action(
                          confirm,
                          confirm === "activation"
                            ? !source?.active
                            : undefined,
                        ).then((result) => {
                          if (result) setConfirm(null);
                        })}
                    >
                      Confirmar{" "}
                      {confirm === "publish" ? "publicación" : "disponibilidad"}
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
                {preview && (
                  <TestPreview
                    key={JSON.stringify(content)}
                    content={content}
                  />
                )}
              </>
            )}
        </>
      )}
    </>
  );
}
