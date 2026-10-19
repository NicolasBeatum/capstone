import { useEffect, useRef, useState } from "react";
import { adminGateway } from "../infrastructure/adminGateway";
import type { FormOptions, StudentPage } from "../domain/types";
import { useWrite } from "./useWrite";
import { errorMessage } from "../components/Feedback";
export function useStudents() {
  const [data, setData] = useState<StudentPage | null>(null),
    [options, setOptions] = useState<FormOptions | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const write = useWrite();
  async function load(query: URLSearchParams) {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await adminGateway.students(query);
      if (current === sequence.current) {
        setData(data);
        write.reset();
      }
    } catch (e) {
      if (current === sequence.current) setError(errorMessage(e));
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load(new URLSearchParams());
    let live = true;
    void adminGateway.formOptions().then((o) => {
      if (live) setOptions(o);
    }).catch((e) => {
      if (live) setError(errorMessage(e));
    });
    return () => {
      live = false;
      sequence.current++;
    };
  }, []);
  async function recover(id: string) {
    setError("");
    setMessage("");
    try {
      await write.run(
        "reset:" + id,
        (requestId) => adminGateway.recover(id, requestId),
      );
      setMessage(
        "Solicitud de recuperación aceptada. El alumno recibirá el enlace en el correo de su cuenta.",
      );
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }
  return {
    data,
    options,
    error,
    message,
    loading,
    busy: write.busy,
    load,
    recover,
  };
}
