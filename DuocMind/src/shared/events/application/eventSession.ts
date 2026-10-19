import type { EventSession } from './eventStore';
export class EventSessionCoordinator {
  private userId: string | null = null;
  private generation = 0;
  private blocked = new Set<string>();
  private listeners = new Set<() => void>();
  setUser(userId: string | null): void {
    if (this.userId === userId) return;
    this.userId = userId; this.generation += 1; this.notify();
  }
  capture(): EventSession | null {
    return this.userId && !this.blocked.has(this.userId) ? { userId: this.userId, generation: this.generation } : null;
  }
  matches(session: EventSession): boolean {
    return this.userId === session.userId && this.generation === session.generation && !this.blocked.has(session.userId);
  }
  block(userId: string): () => void {
    this.blocked.add(userId); this.generation += 1; this.notify();
    return () => { this.blocked.delete(userId); this.generation += 1; this.notify(); };
  }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private notify(): void { for (const listener of this.listeners) listener(); }
}
