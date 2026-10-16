import { useEffect, useState } from "react";
import type { EventType, EventTypeContent } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { errorMessage } from "../components/Feedback";
import { useWrite } from "./useWrite";

export function useEventTypes() {
  const [data, setData] = useState<EventType[]>([]);
  const [source, setSource] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const write = useWrite();
  useEffect(() => {
    let live = true;
    void adminGateway.eventTypes().then((types) => {
      if (live) setData(types);
    }).catch((e) => {
      if (live) setError(errorMessage(e));
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);
  function select(type: EventType | null) {
    setSource(type);
    setError("");
    setMessage("");
    write.reset();
  }
  async function save(content: EventTypeContent): Promise<EventType | null> {
    setError("");
    setMessage("");
    setRefreshing(true);
    try {
      const normalized = { ...content, name: content.name.trim() };
      const result = await write.run(
        JSON.stringify({ source, content: normalized }),
        (requestId) =>
          source
            ? adminGateway.saveEventType(
              source.id,
              { name: normalized.name, order: normalized.order },
              source.revision,
              requestId,
            )
            : adminGateway.createEventType(normalized, requestId),
      );
      const confirmed = {
        ...normalized,
        id: result.id!,
        revision: result.revision,
      };
      // Conservar identidad aunque falle la lectura posterior evita volver a crear el tipo.
      setSource(confirmed);
      setData((current) =>
        [...current.filter((t) => t.id !== confirmed.id), confirmed]
          .sort((a, b) =>
            a.order - b.order || a.name.localeCompare(b.name, "es") ||
            Number(a.id) - Number(b.id)
          )
      );
      setMessage("Tipo de evento guardado en el backend.");
      try {
        setData(await adminGateway.eventTypes());
      } catch (e) {
        setError(
          "El tipo se guardó, pero no se pudo recargar el catálogo. " +
            errorMessage(e),
        );
      }
      return confirmed;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setRefreshing(false);
    }
  }
  async function reload(): Promise<EventType | null> {
    setError("");
    setMessage("");
    setRefreshing(true);
    try {
      const types = await adminGateway.eventTypes();
      setData(types);
      const current = types.find((t) => t.id === source?.id) ?? null;
      setSource(current);
      if (source) write.reset();
      else if (write.unconfirmed) {
        setMessage(
          "Catálogo recargado. Reintenta el mismo guardado para confirmar la creación pendiente.",
        );
      }
      return current;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  return {
    data,
    source,
    loading,
    error,
    message,
    select,
    save,
    reload,
    busy: write.busy || refreshing,
    unconfirmed: write.unconfirmed,
  };
}
