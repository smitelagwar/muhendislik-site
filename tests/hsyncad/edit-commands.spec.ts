import { test, expect } from "@playwright/test";
test("selected beam rotation, measured copy and array update actual model, 3D and history", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("tool-beam").click();
  for (const [x, y] of [[0, 0], [4, 0]]) { await page.getByTestId("coordinate-x").fill(String(x)); await page.getByTestId("coordinate-y").fill(String(y)); await page.getByTestId("coordinate-place").click(); }
  await page.getByRole("tab", { name: "Çizimler", exact: true }).click();
  await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Döndür", exact: true }).click();
  await page.getByRole("button", { name: "İşlemi uygula", exact: true }).click();
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
  await expect.poll(async () => (await saved()).elements[0].end.y).toBeCloseTo(4);
  await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kopyala", exact: true }).click();
  await page.getByRole("button", { name: "İşlemi uygula", exact: true }).click();
  await expect.poll(async () => (await saved()).elements.length).toBe(2);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "2");
  await page.getByRole("button", { name: "Geri al", exact: true }).click();
  await expect.poll(async () => (await saved()).elements.length).toBe(1);
  await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Obje Çoğalt", exact: true }).click();
  await page.getByRole("button", { name: "İşlemi uygula", exact: true }).click();
  await expect.poll(async () => (await saved()).elements.length).toBe(3);
  expect(errors).toEqual([]);
});
