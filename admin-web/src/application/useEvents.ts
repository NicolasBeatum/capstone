import { useEffect, useState } from "react";
import type { EventContent, InstitutionalEvent } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { useWrite } from "./useWrite";
import { errorMessage } from "../components/Feedback";
export function useEvents() {
  const [data, setData] = useState<InstitutionalEvent[]>([]),
    [source, setSource] = useState<InstitutionalEvent | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const write = useWrite();
  useEffect(() => {
    let live = true;
    void adminGateway.events().then((d) => {
      if (live) setData(d);
    }).catch((e) => {
      if (live) setError(errorMessage(e));
    }).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);
  async function load(id = source?.id) {
    const d = await adminGateway.events();
    setData(d);
    const current = d.find((e) => e.id === id) ?? null;
    setSource(current);
    write.reset();
    return current;
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
      setMessage("Evento guardado en el backend.");
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
    select,
    loading,
    error,
    message,
    busy: write.busy,
    save,
    action,
    reload,
  };
}
