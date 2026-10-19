import { useState } from "react";
import { recoveryGateway } from "../infrastructure/recoveryGateway";
import { hasRecoveryToken } from "../infrastructure/recoveryContext";
import { errorMessage } from "../components/Feedback";
export function useRecovery() {
  const [stage, setStage] = useState<"link" | "password" | "done" | "invalid">(
      hasRecoveryToken() ? "link" : "invalid",
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function verify() {
    setBusy(true);
    setError("");
    try {
      await recoveryGateway.verify();
      setStage("password");
    } catch (e) {
      setError(errorMessage(e));
      setStage("invalid");
    } finally {
      setBusy(false);
    }
  }
  async function change(password: string, confirmation: string) {
    setError("");
    if (password !== confirmation) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    if (password.length < 6) {
      setError(
        "Usa al menos seis caracteres y cumple la política de tu cuenta.",
      );
      return;
    }
    setBusy(true);
    try {
      await recoveryGateway.changePassword(password);
      setStage("done");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { stage, busy, error, verify, change };
}
