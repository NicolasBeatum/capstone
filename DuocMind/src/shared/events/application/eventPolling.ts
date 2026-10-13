interface PollingScheduler { every(callback: () => void, milliseconds: number): () => void }
const scheduler: PollingScheduler = {
  every(callback, milliseconds) { const id = setInterval(callback, milliseconds); return () => clearInterval(id); },
};
export function startEventPolling(clock: () => void, refresh: () => void, connected: () => boolean, timers: PollingScheduler = scheduler): () => void {
  const stopClock = timers.every(clock, 30_000);
  const stopRefresh = timers.every(() => { if (connected()) refresh(); }, 60_000);
  return () => { stopClock(); stopRefresh(); };
}
