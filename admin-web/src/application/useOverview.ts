import { useEffect, useRef, useState } from "react";
import type { FormOptions, StudentPage } from "../domain/types";
import { adminGateway } from "../infrastructure/adminGateway";
import { errorMessage } from "../components/Feedback";
export function useOverview() {
  const [students, setStudents] = useState<StudentPage | null>(null);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const sequence = useRef(0);
  async function load() {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    setStudents(null);
    setOptions(null);
    try {
      const [students, options] = await Promise.all([
        adminGateway.students(
          new URLSearchParams({ page: "1", pageSize: "5" }),
        ),
        adminGateway.formOptions(),
      ]);
      if (current === sequence.current) {
        setStudents(students);
        setOptions(options);
      }
    } catch (e) {
      if (current === sequence.current) setError(errorMessage(e));
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, []);
  return { students, options, loading, error, reload: load };
}
