import { useCallback, useEffect, useRef, useState } from "react";
import type { EmotionDashboard, EmotionPeriod } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { errorMessage } from "../components/Feedback";
// Los datos agregados viven solo en memoria: nada se guarda en el navegador.
export function useEmotions() {
  const [days, setDays] = useState<EmotionPeriod>(30);
  const [data, setData] = useState<EmotionDashboard | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const load = useCallback(async (period: EmotionPeriod) => {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const result = await adminGateway.emotions(period);
      if (current === sequence.current) setData(result);
    } catch (e) {
      if (current === sequence.current) setError(errorMessage(e));
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(days);
    return () => {
      sequence.current++;
    };
  }, [days, load]);
  return { days, setDays, data, loading, error, reload: () => load(days) };
}
