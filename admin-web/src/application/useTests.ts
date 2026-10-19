import { useEffect, useState } from "react";
import { adminGateway } from "../infrastructure/adminGateway";
import type { TestCatalog } from "../domain/types";
import { errorMessage } from "../components/Feedback";
export function useTests() {
  const [data, setData] = useState<TestCatalog[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    void adminGateway.tests().then((d) => {
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
  return { data, loading, error };
}
