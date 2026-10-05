import { requestRecovery } from "./recovery.ts";
Deno.test("timeout reserva estado incierto y retry no envía", async () => {
  let state = "reserved";
  let calls = 0;
  const gateway = {
    reserve: async () => ({ send: calls === 0, state }),
    recipient: async () => "fixture@example.test",
    send: async () => {
      calls++;
      throw new DOMException("Timeout", "TimeoutError");
    },
    finish: async (s: "accepted" | "uncertain") => {
      state = s;
    },
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    let failed = false;
    try {
      await requestRecovery(gateway);
    } catch {
      failed = true;
    }
    if (!failed) throw Error("Un envío incierto no confirma éxito.");
  }
  if (calls !== 1 || state !== "uncertain") {
    throw Error("El retry no debe enviar.");
  }
});
