import { identifier } from '../domain/schedule.ts';
import type { PlannerSession } from './plannerContracts.ts';
export class PlannerSessionCoordinator {
  private userId: string | null = null;
  private generation = 0;
  private blocked = new Set<string>();
  private listeners = new Set<() => void>();
  setUser(userId: string | null): void {
    const next = userId === null ? null : identifier(userId);
    if (next === this.userId) return;
    this.userId = next;
    this.generation += 1;
    this.notify();
  }
  capture(): PlannerSession | null {
    return this.userId && !this.blocked.has(this.userId)
      ? { userId: this.userId, generation: this.generation }
      : null;
  }
  matches(session: PlannerSession): boolean {
    const current = this.capture();
    return current?.userId === session.userId && current.generation === session.generation;
  }
  block(userId: string): void {
    const id = identifier(userId);
    if (this.blocked.has(id)) return;
    this.blocked.add(id);
    if (this.userId === id) {
      this.generation += 1;
      this.notify();
    }
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
export function persistedPlannerOwner(value: string | null): string | null {
  if (!value) return null;
  try {
    const v: unknown = JSON.parse(value);
    if (
      !v || typeof v !== 'object' || !('user' in v) || !v.user || typeof v.user !== 'object' ||
      !('id' in v.user) || !('access_token' in v) || typeof v.access_token !== 'string' ||
      !v.access_token || !('refresh_token' in v) || typeof v.refresh_token !== 'string' ||
      !v.refresh_token || !('expires_at' in v) || typeof v.expires_at !== 'number' ||
      !Number.isFinite(v.expires_at)
    ) throw Error();
    return identifier(v.user.id);
  } catch {
    throw new Error('No se pudo leer la sesión guardada.');
  }
}
