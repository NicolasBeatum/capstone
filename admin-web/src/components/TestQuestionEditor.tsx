import type { Question } from "../domain/types";

interface Props {
  question: Question;
  index: number;
  onChange: (question: Question) => void;
  onRemove: () => void;
}
export function TestQuestionEditor(
  { question: q, index, onChange, onRemove }: Props,
) {
  const number = index + 1;
  return (
    <fieldset className="editor-item">
      <legend>Pregunta {number}</legend>
      <label>
        ¿Qué quieres preguntar?
        <textarea
          aria-label={`Pregunta ${number}`}
          aria-describedby={`question-help-${index}`}
          required
          maxLength={5000}
          value={q.text}
          placeholder="Ej.: ¿Con qué frecuencia te cuesta descansar durante el día?"
          onChange={(e) => onChange({ ...q, text: e.target.value })}
        />
      </label>
      <p id={`question-help-${index}`} className="field-help">
        Escribe la pregunta tal como quieres que la lea el alumno.
      </p>
      <details>
        <summary>Añadir indicaciones para responder (opcional)</summary>
        <label>
          Indicaciones adicionales
          <textarea
            aria-label={`Indicaciones de la pregunta ${number}`}
            maxLength={5000}
            value={q.helper}
            placeholder="Ej.: Piensa en lo que has vivido durante la última semana."
            onChange={(e) => onChange({ ...q, helper: e.target.value })}
          />
        </label>
        <p className="field-help">
          Se muestran debajo de esta pregunta. Puedes dejar este campo vacío.
        </p>
      </details>
      <h3>Respuestas que puede elegir el alumno</h3>
      <p className="field-help" id={`answers-help-${index}`}>
        Elegirá una sola respuesta. Sus puntos se sumarán al resultado del test.
        Usa un puntaje distinto para cada respuesta; un puntaje alto significa
        lo que tú definas en el paso Resultados.
      </p>
      {q.options.map((option, j) => (
        <div className="answer-row" key={j}>
          <span className="answer-number" aria-hidden="true">{j + 1}</span>
          <label>
            Respuesta {j + 1}
            <input
              aria-label={`Respuesta ${j + 1} de pregunta ${number}`}
              required
              maxLength={160}
              value={option.text}
              placeholder={j === 0
                ? "Ej.: Nunca"
                : j === 1
                ? "Ej.: A veces"
                : "Escribe otra respuesta"}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((old, k) =>
                    k === j ? { ...old, text: e.target.value } : old
                  ),
                })}
            />
          </label>
          <label>
            Puntos
            <input
              aria-label={`Puntos de respuesta ${j + 1} de pregunta ${number}`}
              aria-describedby={`answers-help-${index}`}
              type="number"
              min={0}
              max={1000}
              step={1}
              required
              value={option.score}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((old, k) =>
                    k === j ? { ...old, score: Number(e.target.value) } : old
                  ),
                })}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={q.options.length <= 2}
            aria-label={`Quitar respuesta ${j + 1} de pregunta ${number}`}
            onClick={() =>
              onChange({ ...q, options: q.options.filter((_o, k) => k !== j) })}
          >
            Quitar
          </button>
        </div>
      ))}
      <div className="actions item-actions">
        <button
          type="button"
          className="secondary"
          disabled={q.options.length >= 20}
          onClick={() =>
            onChange({
              ...q,
              options: [...q.options, {
                text: "",
                score: Math.min(
                  1000,
                  Math.max(...q.options.map((o) => o.score)) + 1,
                ),
              }],
            })}
        >
          Añadir respuesta a pregunta {number}
        </button>
        <button type="button" className="text-danger" onClick={onRemove}>
          Quitar pregunta {number}
        </button>
      </div>
      <p className="field-help">
        Cada pregunta necesita entre 2 y 20 respuestas.
      </p>
    </fieldset>
  );
}
