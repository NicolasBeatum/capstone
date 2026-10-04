import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../application/AuthProvider";
import { errorMessage, Feedback } from "../components/Feedback";
export function Login() {
  const session = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (session.allowed) return <Navigate to="/students" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await session.login(email, password);
      setPassword("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <p className="brand">DUOCMIND</p>
      <h1>Administración de Bienestar y Salud</h1>
      <p>Acceso para funcionarios autorizados</p>
      <form onSubmit={submit}>
        <label>
          Correo institucional<input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Contraseña<input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Feedback error={error} />
        <button disabled={busy}>
          {busy ? "Comprobando acceso…" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}
