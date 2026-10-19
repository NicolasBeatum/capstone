import { useState } from "react";
import type { TestContent } from "../domain/types";
import { previewResult } from "../domain/testRules";
export function TestPreview({ content }: { content: TestContent }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const answers = Object.fromEntries(
    Object.entries(selected).map((
      [i, j],
    ) => [i, content.questions[Number(i)].options[j].score]),
  );
  const result = content.questions.length
    ? previewResult(content, answers)
    : null;
  return (
    <section aria-label="Vista previa" className="test-preview">
      <span className="eyebrow">Simulación del cuestionario</span>
      <h2>{content.title || "Cuestionario sin nombre"}</h2>
      <p>{content.description}</p>
      {!content.questions.length && <p>Añade preguntas para probar el test.</p>}
      {content.questions.map((q, i) => (
        <fieldset key={i}>
          <legend>{i + 1}. {q.text || "Pregunta pendiente"}</legend>
          {q.helper && <p>{q.helper}</p>}
          {q.options.map((o, j) => (
            <label className="inline" key={j}>
              <input
                type="radio"
                name={"preview-" + i}
                checked={selected[i] === j}
                onChange={() => setSelected({ ...selected, [i]: j })}
              />
              {o.text || "Respuesta pendiente"}
            </label>
          ))}
        </fieldset>
      ))}
      {result
        ? (
          <div className="preview-result" role="status">
            <p>Puntaje de vista previa: {result.score}.</p>
            <strong>
              {result.level?.label || "Sin resultado para este puntaje"}
            </strong>
            <p>
              {result.level?.content ||
                "Vuelve a Resultados y configura un intervalo que incluya este total."}
            </p>
          </div>
        )
        : content.questions.length > 0 && (
          <p className="field-help">
            Elige una respuesta por pregunta para ver el puntaje y el mensaje
            final.
          </p>
        )}
      <p className="field-help">
        Orientación no diagnóstica; esta vista previa no guarda respuestas.
      </p>
    </section>
  );
}
