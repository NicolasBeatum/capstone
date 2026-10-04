import { type FormEvent, useState } from "react";
import { useRecovery } from "../application/useRecovery";
import { Feedback } from "../components/Feedback";
export function Recover() {
  const model = useRecovery();
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    void model.change(password, confirmation).then(() => {
      setPassword("");
      setConfirmation("");
    });
  }
  return (
    <main className="login">
      <p className="brand">DUOCMIND</p>
      <h1>Establecer nueva contraseña</h1>
      <Feedback error={model.error} />
      {model.stage === "link" && (
        <>
          <p>Valida el enlace para continuar con el cambio de tu contraseña.</p>
          <button disabled={model.busy} onClick={() => void model.verify()}>
            {model.busy ? "Validando…" : "Validar enlace"}
          </button>
        </>
      )}
      {model.stage === "password" && (
        <form onSubmit={submit}>
          <label>
            Nueva contraseña<input
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirmar contraseña<input
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <p className="muted">
            Al menos seis caracteres; usa una contraseña única y cumple la
            política de tu cuenta.
          </p>
          <button disabled={model.busy}>
            {model.busy ? "Guardando…" : "Guardar nueva contraseña"}
          </button>
        </form>
      )}
      {model.stage === "done" && (
        <p role="status">
          Contraseña actualizada. Ya puedes ingresar a DuocMind.
        </p>
      )}
      {model.stage === "invalid" && (
        <p>
          El enlace no está disponible. Solicita un nuevo enlace de
          recuperación.
        </p>
      )}
    </main>
  );
}
