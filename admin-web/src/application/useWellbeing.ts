import { useCallback, useEffect, useRef, useState } from "react";
import type { CareerOption, WellbeingPeriod, WellbeingTab, WellbeingTabData } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { errorMessage } from "../components/Feedback";

type Cache = Map<string, WellbeingTabData[WellbeingTab]>;

/**
 * Estado del dashboard: periodo y carrera viven en memoria, la pestaña en la URL. Solo se pide
 * la pestaña visible y cada combinación se guarda en memoria (nunca en el navegador) para que
 * volver a una pestaña no repita la petición.
 */
export function useWellbeing<T extends WellbeingTab>(tab: T) {
  const [days, setDaysState] = useState<WellbeingPeriod>(30);
  const [careerId, setCareerId] = useState<string | null>(null);
  const [careers, setCareers] = useState<CareerOption[]>([]);
  // Los datos se guardan con su clave: al cambiar de pestaña, periodo o carrera, lo anterior
  // nunca llega a la vista nueva (la pestaña Motivos no debe recibir datos del Resumen).
  const [loaded, setLoaded] = useState<{ key: string; value: WellbeingTabData[WellbeingTab] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cache = useRef<Cache>(new Map());
  const sequence = useRef(0);

  const key = [tab, days, careerId ?? ""].join("|");
  const load = useCallback(async (force = false) => {
    const current = ++sequence.current;
    const cached = cache.current.get(key) as WellbeingTabData[T] | undefined;
    if (cached && !force) {
      setLoaded({ key, value: cached });
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    setLoaded(null);
    try {
      const result = await adminGateway.wellbeing(tab, days, careerId);
      cache.current.set(key, result);
      if (current === sequence.current) setLoaded({ key, value: result });
    } catch (e) {
      if (current === sequence.current) setError(errorMessage(e));
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [key, tab, days, careerId]);

  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [load]);

  // Carreras del selector: solo las que reúnen 5 participantes en el periodo. Si la elegida
  // deja de cumplirlo al cambiar de periodo, se vuelve a «Todas las carreras».
  useEffect(() => {
    let active = true;
    adminGateway.careersAvailable(days).then((list) => {
      if (!active) return;
      setCareers(list);
      setCareerId((id) => (id && !list.some((c) => c.id === id) ? null : id));
    }).catch(() => active && setCareers([]));
    return () => {
      active = false;
    };
  }, [days]);

  return {
    days,
    setDays: (d: WellbeingPeriod) => setDaysState(d),
    careerId,
    setCareerId,
    careers,
    data: loaded?.key === key ? (loaded.value as WellbeingTabData[T]) : null,
    loading: loading || (loaded?.key !== key && !error),
    error,
    reload: () => {
      cache.current.clear();
      return load(true);
    },
  };
}
