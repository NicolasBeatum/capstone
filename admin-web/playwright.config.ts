import { defineConfig } from "@playwright/test";
const port = Number(process.env.ADMIN_E2E_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw Error("Puerto E2E inválido.");
}
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
  workers: 1,
});
