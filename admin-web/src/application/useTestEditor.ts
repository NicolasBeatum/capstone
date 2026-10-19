import { useEffect, useRef, useState } from "react";
import { adminGateway } from "../infrastructure/adminGateway";
import type { TestContent, TestVersion } from "../domain/types";
import { useWrite } from "./useWrite";
import { validatePublication } from "../domain/testRules";
import { errorMessage } from "../components/Feedback";
const blank: TestContent = {
  title: "",
  description: "",
  questions: [],
  levels: [],
};
function editable(v: TestContent): TestContent {
  return {
    title: v.title,
    description: v.description,
    questions: v.questions.map((q) => ({
      text: q.text,
      helper: q.helper,
      options: q.options.map((o) => ({ text: o.text, score: o.score })),
    })),
    levels: v.levels.map((l) => ({ ...l })),
  };
}
export function useTestEditor(id?: string) {
  const [source, setSource] = useState<TestVersion | null>(null),
    [content, setContent] = useState<TestContent>(blank),
    [loading, setLoading] = useState(!!id),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const write = useWrite(), generation = useRef(0);
  async function reload() {
    const current = ++generation.current;
    if (!id) {
      setSource(null);
      setContent(blank);
      setLoading(false);
      write.reset();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const v = await adminGateway.version(id);
      if (current === generation.current) {
        setSource(v);
        setContent(editable(v));
        write.reset();
      }
    } catch (e) {
      if (current === generation.current) setError(errorMessage(e));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [id]);
  async function save() {
    setError("");
    setMessage("");
    try {
      if (id && source?.versionId !== id) {
        throw new Error("Recarga la versión antes de guardar cambios.");
      }
      const result = await write.run(
        JSON.stringify({ id, revision: source?.revision, content }),
        (rid) =>
          id && source
            ? adminGateway.saveTest(id, content, source.revision, rid)
            : adminGateway.createTest(content, rid),
      );
      if (id) await reload();
      setMessage("Borrador guardado en el backend.");
      return result;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    }
  }
  async function action(
    action: "publish" | "activation" | "clone",
    active?: boolean,
  ) {
    if (!source || source.versionId !== id) return null;
    setError("");
    setMessage("");
    if (action === "publish") {
      const invalid = validatePublication(content);
      if (invalid) {
        setError(invalid);
        return null;
      }
      if (JSON.stringify(content) !== JSON.stringify(editable(source))) {
        setError("Guarda los cambios antes de publicar.");
        return null;
      }
    }
    try {
      const result = await write.run(
        JSON.stringify({ id, action, revision: source.revision, active }),
        (rid) =>
          adminGateway.testAction(
            source.versionId,
            action,
            source.revision,
            rid,
            active,
          ),
      );
      if (action !== "clone") await reload();
      setMessage(
        action === "publish"
          ? "Versión publicada. Su activación es una operación aparte."
          : action === "activation"
          ? "Disponibilidad actualizada en el catálogo del backend."
          : "Nueva versión creada en borrador.",
      );
      return result;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    }
  }
  return {
    source,
    content,
    setContent,
    loading,
    error,
    message,
    busy: write.busy,
    reload,
    save,
    action,
  };
}
