import { useRef, useState } from "react";
import { ApiError } from "../infrastructure/adminGateway";
export function useWrite() {
  const pending = useRef<
    { signature: string; requestId: string; createdAt: number } | null
  >(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run<T>(
    signature: string,
    operation: (id: string) => Promise<T>,
  ): Promise<T> {
    if (running.current) throw Error("Hay una operación pendiente.");
    if (
      pending.current &&
      Date.now() - pending.current.createdAt >= 24 * 60 * 60 * 1000
    ) {
      throw Error(
        "La protección del reintento venció. Recarga el estado antes de volver a guardar.",
      );
    }
    if (pending.current && pending.current.signature !== signature) {
      throw Error(
        "Hay una petición sin confirmar. Consulta y recarga su estado antes de enviar cambios diferentes.",
      );
    }
    if (!pending.current) {
      pending.current = {
        signature,
        requestId: crypto.randomUUID(),
        createdAt: Date.now(),
      };
    }
    running.current = true;
    setBusy(true);
    try {
      const value = await operation(pending.current.requestId);
      pending.current = null;
      return value;
    } catch (e) {
      if (e instanceof ApiError && e.status !== 503) pending.current = null;
      throw e;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    run,
    busy,
    reset: () => {
      pending.current = null;
    },
  };
}
