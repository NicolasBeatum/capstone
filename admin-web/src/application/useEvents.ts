import { useEffect, useState } from "react";
import type {
  EventContent,
  EventType,
  InstitutionalEvent,
} from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { useWrite } from "./useWrite";
import { errorMessage } from "../components/Feedback";
export function useEvents() {
  const [data, setData] = useState<InstitutionalEvent[]>([]),
    [source, setSource] = useState<InstitutionalEvent | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [types, setTypes] = useState<EventType[]>([]);
  const [typesReady, setTypesReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const write = useWrite();
  useEffect(() => {
    let live = true;
    void Promise.all([adminGateway.events(), adminGateway.eventTypes()]).then(
      ([d, catalog]) => {
        if (live) {
          setData(d);
          setTypes(catalog);
          setTypesReady(true);
        }
      },
    ).catch((e) => {
      if (live) setError(errorMessage(e));
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);
  async function load(id = source?.id) {
    setRefreshing(true);
    try {
      const [d, catalog] = await Promise.all([
        adminGateway.events(),
        adminGateway.eventTypes(),
      ]);
      setData(d);
      setTypes(catalog);
      setTypesReady(true);
      const current = d.find((e) => e.id === id) ?? null;
      setSource(current);
      write.reset();
      return current;
    } finally {
      setRefreshing(false);
    }
  }
  function select(event: InstitutionalEvent | null) {
    setSource(event);
    setError("");
    setMessage("");
    write.reset();
  }
  async function save(content: EventContent) {
    setError("");
    setMessage("");
    try {
      if (!typesReady) {
        throw Error("Recarga el catálogo de tipos antes de guardar.");
      }
      if (
        content.typeId !== null &&
        !types.some((type) => type.id === content.typeId)
      ) {
        throw Error(
          "El tipo seleccionado no está disponible. Recarga el catálogo.",
        );
      }
      const result = await write.run(
        JSON.stringify({ source, content }),
        (rid) =>
          adminGateway.saveEvent(
            source?.id ?? null,
            content,
            source?.revision ?? 1,
            rid,
          ),
      );
      setSource({
        ...content,
        id: result.id!,
        revision: result.revision,
        status: source?.status ?? "draft",
        publishedAt: source?.publishedAt ?? null,
      });
      await load(result.id);
      const registrationMessage =
        content.registrationClosed !== source?.registrationClosed
          ? content.registrationClosed
            ? " Inscripción cerrada por la organización."
            : source?.registrationClosed
            ? " Inscripción reabierta."
            : ""
          : "";
      setMessage("Evento guardado en el backend." + registrationMessage);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }
  async function action(action: "publish" | "cancel") {
    if (!source) return false;
    setError("");
    setMessage("");
    try {
      await write.run(
        JSON.stringify({ source, action }),
        (rid) =>
          adminGateway.eventAction(source.id, action, source.revision, rid),
      );
      await load();
      setMessage(
        action === "publish"
          ? "Evento publicado en el backend."
          : "Evento cancelado; su contenido se conserva.",
      );
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }
  async function reload() {
    setError("");
    try {
      return await load();
    } catch (e) {
      setError(errorMessage(e));
      return null;
    }
  }
  return {
    data,
    source,
    types,
    typesReady,
    select,
    loading,
    error,
    message,
    busy: write.busy || refreshing,
    unconfirmed: write.unconfirmed,
    save,
    action,
    reload,
  };
}
