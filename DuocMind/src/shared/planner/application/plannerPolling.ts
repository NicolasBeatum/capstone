export interface PlannerTimers {
  set(action: () => void): unknown;
  clear(handle: unknown): void;
}
export function startPlannerPolling(
  tick: () => void,
  sync: () => void,
  connected: () => boolean,
  timers: PlannerTimers = {
    set: (action) => setInterval(action, 60000),
    clear: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
  },
): () => void {
  let stopped = false;
  const handle = timers.set(() => {
    if (stopped) return;
    tick();
    if (connected()) sync();
  });
  return () => {
    if (!stopped) {
      stopped = true;
      timers.clear(handle);
    }
  };
}
