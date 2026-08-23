import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

type DxfFixture = {
  name: string;
  content: string;
};

function createDxf(entities: string[]): string {
  return [
    "0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1027", "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
    "0", "LAYER", "2", "KALIP", "70", "0", "62", "2", "6", "CONTINUOUS",
    "0", "ENDTAB", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES",
    ...entities,
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return ["0", "LINE", "8", "KALIP", "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2)].join("\n");
}

function createPatternedDxf(): string {
  const ltype = (name: string, pattern: number[]) => [
    "0", "LTYPE", "2", name, "70", "0", "3", name, "72", "65", "73", String(pattern.length),
    "40", String(pattern.reduce((sum, value) => sum + Math.abs(value), 0)),
    ...pattern.flatMap((value) => ["49", String(value), "74", "0"]),
  ];
  const layer = (name: string, color: number, lineType: string) => [
    "0", "LAYER", "2", name, "70", "0", "62", String(color), "6", lineType,
  ];
  const patternedLine = (layerName: string, y: number, explicitLineType?: string) => [
    "0", "LINE", "8", layerName,
    ...(explicitLineType ? ["6", explicitLineType] : []),
    "48", "1",
    "10", "0", "20", String(y), "11", "420", "21", String(y),
  ];

  return [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1027",
    "9", "$LTSCALE", "40", "1.5",
    "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES",
    "0", "TABLE", "2", "LTYPE", "70", "4",
    ...ltype("CONTINUOUS", []),
    ...ltype("DASHED", [18, -9]),
    ...ltype("CENTER", [30, -6, 6, -6]),
    ...ltype("HIDDEN", [12, -6]),
    "0", "ENDTAB",
    "0", "TABLE", "2", "LAYER", "70", "4",
    ...layer("0", 7, "CONTINUOUS"),
    ...layer("DASH", 1, "DASHED"),
    ...layer("CENTERLINE", 3, "CENTER"),
    ...layer("HIDDENLINE", 5, "HIDDEN"),
    "0", "ENDTAB",
    "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    ...patternedLine("DASH", 0),
    ...patternedLine("CENTERLINE", 80),
    ...patternedLine("HIDDENLINE", 160),
    ...patternedLine("0", 240, "DASHED"),
    "0", "LWPOLYLINE", "8", "CENTERLINE", "90", "3", "70", "0", "48", "0.75",
    "10", "0", "20", "320", "10", "160", "20", "320", "10", "420", "20", "390",
    "0", "ARC", "8", "HIDDENLINE", "10", "210", "20", "520", "40", "120", "50", "0", "51", "270",
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

const fixtures: DxfFixture[] = [
  {
    name: "kucuk-cizim.dxf",
    content: createDxf([line(0, 0, 400, 0), line(400, 0, 400, 250), line(400, 250, 0, 250), line(0, 250, 0, 0)]),
  },
  {
    name: "proje-plani.dxf",
    content: createDxf([
      line(0, 0, 1200, 0), line(1200, 0, 1200, 800), line(1200, 800, 0, 800), line(0, 800, 0, 0),
      line(300, 0, 300, 800), line(750, 0, 750, 800), line(0, 400, 1200, 400),
      "0\nCIRCLE\n8\nKALIP\n10\n525\n20\n400\n40\n120",
      "0\nTEXT\n8\nKALIP\n10\n40\n20\n730\n40\n45\n1\nKALIP PLANI",
    ]),
  },
  {
    name: "buyuk-karma-cizim.dxf",
    content: createDxf(Array.from({ length: 750 }, (_, index) => {
      const x = (index % 50) * 80;
      const y = Math.floor(index / 50) * 80;
      return `${line(x, y, x + 70, y)}\n${line(x + 70, y, x + 70, y + 70)}\n${line(x + 70, y + 70, x, y + 70)}\n${line(x, y + 70, x, y)}`;
    })),
  },
];

async function signIn(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username");
  const dashboard = page.getByRole("button", { name: "Yeni Dosya Yükle" });
  await expect.poll(async () => {
    if (await username.isVisible()) return "login";
    if (await dashboard.isVisible()) return "dashboard";
    return "pending";
  }, { timeout: 12_000 }).not.toBe("pending");

  if (await username.isVisible()) {
    await username.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).click();
  }
  await expect(dashboard).toBeVisible();
}

async function uploadDxf(page: Page, fixture: DxfFixture): Promise<string> {
  return page.evaluate(async ({ content, name }) => {
    const formData = new FormData();
    formData.append("file", new File([content], name, { type: "application/dxf" }));
    formData.append("pathname", `cad-dxf-${crypto.randomUUID()}.dxf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "DXF fixture yüklenemedi");
    return payload.file.id as string;
  }, fixture);
}

async function forceUpstreamUnavailable(page: Page): Promise<void> {
  await page.route("**/cad-upstream/**", async (route) => {
    await route.abort("failed");
  });
}

async function expectUpstreamDxfReady(page: Page) {
  const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
  const host = runtime.locator('[data-cad-upstream-host="true"]').first();
  await expect(runtime).toBeVisible({ timeout: 30_000 });
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  await expect(host.locator("canvas").first()).toBeVisible();
  await expect(page.getByText("DXF açılamadı")).toHaveCount(0);
  return host.locator("canvas").first();
}

test("DXF upstream-primary küçük, proje-benzeri ve büyük çizimleri açar; etkileşim sonrası hazır kalır", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await signIn(page);

  for (const fixture of fixtures) {
    const fileId = await uploadDxf(page, fixture);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const canvas = await expectUpstreamDxfReady(page);
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Upstream DXF canvas bulunamadı");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -240);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 50);
    await page.mouse.up();

    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
    await expect(canvas).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
});

test("upstream kullanılamadığında DASHED CENTER HIDDEN legacy DXF fallback worker ile render edilir", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await forceUpstreamUnavailable(page);
  await signIn(page);
  const fileId = await uploadDxf(page, { name: "linetype-stage2.dxf", content: createPatternedDxf() });
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  await expect(page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="current"]').first()).toBeVisible({ timeout: 30_000 });
  const viewer = page.getByTestId("cad-dxf-viewer").first();
  await expect(viewer).toBeVisible();
  await expect(viewer).toHaveAttribute("data-cad-load-state", "ready", { timeout: 30_000 });
  await expect(page.getByTestId("cad-dxf-canvas").first().locator("canvas")).toBeVisible();
  await expect(page.getByText("DXF açılamadı")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("bozuk DXF kontrollü hata ve yeniden deneme eylemi gösterir", async ({ page }) => {
  await signIn(page);
  const fileId = await uploadDxf(page, { name: "bozuk.dxf", content: "0\nSECTION\n2\nENTITIES\n0\nLINE" });
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  await expect(page.getByText("DXF açılamadı")).toBeVisible();
  await expect(page.getByText("Dosya:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tekrar dene" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dosyayı indir" })).toBeVisible();
});

test("legacy DXF worker runtime hatası sonsuz loading yerine terminal hata üretir", async ({ page }) => {
  await forceUpstreamUnavailable(page);
  await page.addInitScript(() => {
    class ForcedFailingWorker extends EventTarget {
      onerror: ((this: Worker, ev: ErrorEvent) => unknown) | null = null;
      onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
      onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null;

      constructor() {
        super();
        window.setTimeout(() => {
          const event = new ErrorEvent("error", { message: "forced-dxf-worker-runtime-error" });
          this.dispatchEvent(event);
          this.onerror?.call(this as unknown as Worker, event);
        }, 25);
      }

      postMessage(): void {}
      terminate(): void {}
    }

    Object.defineProperty(window, "Worker", {
      configurable: true,
      writable: true,
      value: ForcedFailingWorker,
    });
  });

  await signIn(page);
  const fileId = await uploadDxf(page, fixtures[0]);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  await expect(page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="current"]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("DXF açılamadı")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("DXF hazırlanıyor")).toHaveCount(0);
  await expect(page.getByText(/forced-dxf-worker-runtime-error/)).toBeVisible();
});

const realProjectDxfPath = process.env.CAD_DXF_PROJECT_FIXTURE;

test("yerel gerçek proje DXF'i upstream-primary açılır", async ({ page }) => {
  test.skip(!realProjectDxfPath || !existsSync(realProjectDxfPath), "CAD_DXF_PROJECT_FIXTURE tanımlı değil.");
  const content = readFileSync(realProjectDxfPath!, "utf8");
  const fileName = realProjectDxfPath!.split(/[\\/]/).at(-1) || "gercek-proje.dxf";

  await signIn(page);
  const fileId = await uploadDxf(page, { name: fileName, content });
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expectUpstreamDxfReady(page);
});
