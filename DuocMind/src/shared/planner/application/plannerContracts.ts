export interface PlannerSession {
  userId: string;
  generation: number;
}
export interface PlannerSessionGateway {
  current(): Promise<PlannerSession | null>;
  isCurrent(session: PlannerSession): Promise<boolean>;
  subscribe(listener: () => void): () => void;
}
export interface PlannerAccountGateway {
  /** Consulta la cuenta en Auth y devuelve su error, o null si no hubo respuesta negativa. */
  lookup(session: PlannerSession): Promise<{ code?: string } | null>;
  erase(userId: string): Promise<void>;
}
export class PlannerAuthError extends Error {
  constructor() {
    super('Renueva tu sesión para abrir tu agenda.');
  }
}
