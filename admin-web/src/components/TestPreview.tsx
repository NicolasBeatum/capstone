import { useState } from "react";
import type { TestContent } from "../domain/types";
import { previewResult } from "../domain/testRules";
export function TestPreview({ content }: { content: TestContent }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const result = previewResult(content, answers);
  return (
    <section aria-label="Vista previa">
      <h2>{content.title || "Cuestionario sin título"}</h2>
      <p>{content.description}</p>
      {content.questions.map((q, i) => (
        <fieldset key={i}>
          <legend>{i + 1}. {q.text}</legend>
          <p>{q.helper}</p>
          {q.options.map((o, j) => (
            <label className="inline" key={j}>
              <input
                type="radio"
                name={"preview-" + i}
                checked={answers[i] === o.score}
                onChange={() => setAnswers({ ...answers, [i]: o.score })}
              />
              {o.text}
            </label>
          ))}
        </fieldset>
      ))}
      {result && (
        <p role="status">
          Puntaje de vista previa: {result.score}.{" "}
          {result.level?.label ?? "Sin nivel coincidente"}.{" "}
          {result.level?.content}
        </p>
      )}
      <p className="muted">
        Orientación no diagnóstica; esta vista previa no guarda respuestas.
      </p>
    </section>
  );
}
