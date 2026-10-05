import { useState } from "react";
import type { TestVersion } from "../domain/types";
export function ProtectedInstrument(
  { version, busy, onActivation }: {
    version: TestVersion;
    busy: boolean;
    onActivation: () => Promise<unknown>;
  },
) {
  const [confirm, setConfirm] = useState(false);
  return (
    <section>
      <h2>{version.title}</h2>
      <p>{version.description}</p>
      <p className="muted">
        Instrumento validado: preguntas, opciones, puntajes, niveles y cálculo
        están protegidos. Su cálculo se conserva según la definición original.
      </p>
      {version.questions.map((q, i) => (
        <section className="card" key={i}>
          <h3>{i + 1}. {q.text}</h3>
          <p>{q.helper}</p>
          {q.critical && <p>Ítem crítico protegido</p>}
          <ul>
            {q.options.map((o, j) => (
              <li key={j}>{o.text} · Puntaje {o.score}</li>
            ))}
          </ul>
        </section>
      ))}
      <h2>Niveles protegidos</h2>
      {version.levels.map((l) => (
        <section className="card" key={l.key}>
          <h3>{l.label || l.key} · {l.min}–{l.max}</h3>
          <p>{l.content}</p>
        </section>
      ))}
      <button disabled={busy} onClick={() => setConfirm(true)}>
        {version.active ? "Desactivar instrumento" : "Activar instrumento"}
      </button>
      {confirm && (
        <section className="card" aria-label="Confirmar disponibilidad">
          <p>
            Esta operación cambia la disponibilidad en el backend y conserva el
            contenido del instrumento.
          </p>
          <button
            disabled={busy}
            onClick={() =>
              void onActivation().then((result) => {
                if (result) {
                  setConfirm(false);
                }
              })}
          >
            Confirmar disponibilidad
          </button>{" "}
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              setConfirm(false)}
          >
            Volver
          </button>
        </section>
      )}
    </section>
  );
}
