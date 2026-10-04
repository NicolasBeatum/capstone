import { HttpError } from "./validation.ts";
export type Reservation = { send: boolean; state: string };
export interface RecoveryGateway {
  reserve(): Promise<Reservation>;
  recipient(): Promise<string>;
  send(email: string): Promise<boolean>;
  finish(state: "accepted" | "uncertain"): Promise<void>;
}
export async function requestRecovery(
  gateway: RecoveryGateway,
): Promise<{ accepted: true }> {
  const reservation = await gateway.reserve();
  if (!reservation.send) {
    if (reservation.state === "accepted") return { accepted: true };
    throw new HttpError(
      503,
      "No se puede confirmar el envío. Consulta el estado antes de solicitar otro enlace.",
    );
  }
  let state: "accepted" | "uncertain" = "uncertain";
  try {
    const email = await gateway.recipient();
    if (await gateway.send(email)) state = "accepted";
  } catch { /* Una reserva incierta nunca se reenvía automáticamente. */ }
  await gateway.finish(state);
  if (state === "uncertain") {
    throw new HttpError(503, "No se puede confirmar el envío.");
  }
  return { accepted: true };
}
