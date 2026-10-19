import { expect, test } from "@playwright/test";
test("identidad y acceso de la administración", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Administración de Bienestar y Salud" }),
  ).toBeVisible();
});
