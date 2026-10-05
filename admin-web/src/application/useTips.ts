import { useEffect, useState } from "react";
import type { FormOptions, Tip, TipContent } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { useWrite } from "./useWrite";
import { errorMessage } from "../components/Feedback";
export function useTips() {
  const [data, setData] = useState<Tip[]>([]),
    [options, setOptions] = useState<FormOptions | null>(null),
    [source, setSource] = useState<Tip | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const write = useWrite();
  useEffect(() => {
    let live = true;
    void Promise.all([adminGateway.tips(), adminGateway.formOptions()]).then(
      ([d, o]) => {
        if (live) {
          setData(d);
          setOptions(o);
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
    const [d, o] = await Promise.all([
      adminGateway.tips(),
      adminGateway.formOptions(),
    ]);
    setData(d);
    setOptions(o);
    const current = d.find((e) => e.id === id) ?? null;
    setSource(current);
    write.reset();
    return current;
  }
  function select(tip: Tip | null) {
    setSource(tip);
    setError("");
    setMessage("");
    write.reset();
  }
  async function save(content: TipContent) {
    setError("");
    setMessage("");
    try {
      const result = await write.run(
        JSON.stringify({ source, content }),
        (rid) =>
          adminGateway.saveTip(
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
        publicationStatus: source?.publicationStatus ?? "draft",
        publishedAt: source?.publishedAt ?? null,
        active: source?.active ?? false,
      });
      await load(result.id);
      setMessage("Tip y reglas guardados en el backend.");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }
  async function action(action: "publish" | "activation", active?: boolean) {
    if (!source) return false;
    setError("");
    setMessage("");
    try {
      await write.run(
        JSON.stringify({ source, action, active }),
        (rid) =>
          adminGateway.tipAction(
            source.id,
            action,
            source.revision,
            rid,
            active,
          ),
      );
      await load();
      setMessage(
        action === "publish"
          ? "Tip publicado en el backend."
          : "Disponibilidad del tip actualizada.",
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
    options,
    source,
    select,
    loading,
    error,
    message,
    busy: write.busy,
    unconfirmed: write.unconfirmed,
    save,
    action,
    reload,
  };
}
