import type { ResultLevel } from "../domain/types";

interface Props {
  result: ResultLevel;
  index: number;
  onChange: (result: ResultLevel) => void;
  onRemove: () => void;
}
export function TestResultEditor({ result, index, onChange, onRemove }: Props) {
  const number = index + 1;
  return (
    <fieldset className="editor-item">
      <legend>Resultado {number}</legend>
      <label>
        Nombre del resultado
        <input
          aria-label={`Nombre del resultado ${number}`}
          required
          maxLength={160}
          value={result.label}
          placeholder="Ej.: Conviene hacer una pausa"
          onChange={(e) => onChange({ ...result, label: e.target.value })}
        />
      </label>
      <p className="field-help">Es el título que verá el alumno al terminar.</p>
      <div className="result-range">
        <label>
          Desde (puntos)
          <input
            aria-label={`Desde, resultado ${number}`}
            type="number"
            min={0}
            max={100000}
            step={1}
            required
            value={result.min}
            onChange={(e) =>
              onChange({ ...result, min: Number(e.target.value) })}
          />
        </label>
        <span aria-hidden="true">hasta</span>
        <label>
          Hasta (puntos)
          <input
            aria-label={`Hasta, resultado ${number}`}
            type="number"
            min={0}
            max={100000}
            step={1}
            required
            value={result.max}
            onChange={(e) =>
              onChange({ ...result, max: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="field-help">
        Se muestra este resultado cuando la suma de puntos cae dentro de este
        intervalo, incluidos ambos extremos.
      </p>
      <label>
        Mensaje para el alumno
        <textarea
          aria-label={`Mensaje del resultado ${number}`}
          required
          maxLength={5000}
          value={result.content}
          placeholder="Ej.: Reserva unos minutos para descansar y retomar tus actividades con calma."
          onChange={(e) => onChange({ ...result, content: e.target.value })}
        />
      </label>
      <p className="field-help">
        Explica el resultado y ofrece una orientación práctica, sin
        diagnósticos.
      </p>
      <button type="button" className="text-danger" onClick={onRemove}>
        Quitar resultado {number}
      </button>
    </fieldset>
  );
}
