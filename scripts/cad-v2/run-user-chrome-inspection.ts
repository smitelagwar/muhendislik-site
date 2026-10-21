import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface FileInspectionTarget {
  id: string;
  name: string;
  ext: string;
}

const TARGET_FILES: FileInspectionTarget[] = [
  {
    id: "dc3aa019-28a2-4035-b6f1-2636199f62ee",
    name: "1 ve 2.kat dwg.dwg",
    ext: ".dwg",
  },
  {
    id: "bcec9dd8-39f3-44ca-9625-2c9fedddb5cf",
    name: "kalip_plani_zeminkat.dxf",
    ext: ".dxf",
  },
  {
    id: "9a816267-da9a-4b73-a5ac-c310af752013",
    name: "mustafa selvimimariiiii.dwg",
    ext: ".dwg",
  },
  {
    id: "b24bd2bf-e0ab-4874-aaf3-80606fb3dd18",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg",
    ext: ".dwg",
  },
  {
    id: "ce39e43d-b018-4dc9-809e-650fc24ed278",
    name: "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf",
    ext: ".dxf",
  },
];

async function main() {
  const outputDir = path.resolve(process.cwd(), "tests/visual-inspection/screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("=== CAD V1 / V2 Gerçek Dosya Tarayıcı İncelemesi Başlatılıyor ===");
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--enable-webgl2",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--in-process-gpu",
      "--disable-gpu-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Console mesajlarını yakala
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("CAD") || text.includes("cad") || text.includes("DV2") || text.includes("error") || text.includes("Error")) {
      console.log(`[Browser ${msg.type()}]:`, text.slice(0, 200));
    }
  });

  // 1. Admin Girişi
  console.log("Admin girişi yapılıyor...");
  await page.goto("http://127.0.0.1:3000/dokumantasyon", { waitUntil: "networkidle", timeout: 30000 });

  const usernameInput = page.locator("input#username");
  if (await usernameInput.isVisible()) {
    await usernameInput.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.locator("button[type='submit']").click();
    await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  }
  console.log("Admin oturumu hazır.");

  const filterArg = process.argv[2]?.toLowerCase();
  const targetList = filterArg
    ? TARGET_FILES.filter(
        (f) => f.name.toLowerCase().includes(filterArg) || f.id.toLowerCase().includes(filterArg)
      )
    : TARGET_FILES;

  const results: unknown[] = [];

  for (const target of targetList) {
    console.log(`\n----------------------------------------`);
    console.log(`Dosya Test Ediliyor: ${target.name} (${target.id})`);
    const fileResult: unknown = {
      id: target.id,
      name: target.name,
      ext: target.ext,
      v2Phase: "unknown",
      v1Visible: false,
      v2Visible: false,
      splitVisible: false,
      screenshots: {},
      errors: [],
    };

    try {
      // 1. V2 Motorunda Aç
      // Network'te manifest yanıtını dinle
      let manifestReceived: unknown = null;
      page.on("response", async (res) => {
        if (res.url().includes("/manifest") && res.ok()) {
          try {
            manifestReceived = await res.json();
            console.log("   [Manifest Network Intercepted] SceneId:", manifestReceived?.sceneId, "Layout bbox:", manifestReceived?.layouts?.[0]?.bbox);
          } catch {}
        }
      });

      await page.goto(`http://127.0.0.1:3000/dokumantasyon/dosya/${target.id}?cadEngine=v2`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      // V2 Host var mı?
      const v2Host = page.locator("[data-cad-v2-host='true']").first();
      await v2Host.waitFor({ state: "visible", timeout: 30000 });
      fileResult.v2Visible = true;

      // V2 Fazını bekle
      const startTime = Date.now();
      let currentPhase = "unknown";
      while (Date.now() - startTime < 90000) {
        currentPhase = (await v2Host.getAttribute("data-v2-phase")) || "unknown";
        if (currentPhase === "ready" || currentPhase === "degraded" || currentPhase === "failed" || currentPhase === "fatal_fallback") {
          break;
        }
        await page.waitForTimeout(1000);
      }
      fileResult.v2Phase = currentPhase;
      console.log(`   V2 Fazı: ${currentPhase} (Süre: ${((Date.now() - startTime) / 1000).toFixed(1)}s)`);

      await page.waitForTimeout(3000);

      // V2 Ekran Görüntüsü
      const safeName = target.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const v2ScreenshotPath = path.join(outputDir, `${safeName}_v2.png`);
      await page.screenshot({ path: v2ScreenshotPath });
      fileResult.screenshots.v2 = v2ScreenshotPath;
      console.log(`   V2 Ekran Görüntüsü Kaydedildi: ${path.basename(v2ScreenshotPath)}`);

      // 2. Split-View (V1/V2 Karşılaştır) Moduna Geç
      console.log(`-> Split-View karşılaştırma moduna geçiliyor...`);
      const splitBtn = page.locator("button:has-text('Karşılaştır')").first();
      if (await splitBtn.isVisible()) {
        await splitBtn.click();
        await page.waitForTimeout(1000);

        const splitContainer = page.locator("[data-testid='cad-split-view']");
        await splitContainer.waitFor({ state: "visible", timeout: 20000 });
        fileResult.splitVisible = true;

        // V1 ve V2 motorlarının çizimini bekle
        await page.waitForTimeout(6000);

        const splitScreenshotPath = path.join(outputDir, `${safeName}_split.png`);
        await page.screenshot({ path: splitScreenshotPath });
        fileResult.screenshots.split = splitScreenshotPath;
        console.log(`   Split Ekran Görüntüsü Kaydedildi: ${path.basename(splitScreenshotPath)}`);
      }

      // 3. Klasik V1 Moduna Doğrudan URL ile Git
      console.log(`-> Klasik V1 moduna gidiliyor...`);
      await page.goto(`http://127.0.0.1:3000/dokumantasyon/dosya/${target.id}?cadEngine=v1`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(10000);
      const v1ScreenshotPath = path.join(outputDir, `${safeName}_v1.png`);
      await page.screenshot({ path: v1ScreenshotPath });
      // Sayfadaki V1 sahne varlıklarında *U37 bloğunu bul
      const v1U37Info = await page.evaluate(() => {
        const w = window as unknown;
        const adapter = w.__cadAdapter;
        const db = adapter?.manager?.curDocument?.database;
        if (!db) return { noDb: true };
        const ms = db.tables?.blockTable?.getAt?.("*Model_Space");
        const ents = ms?.entities || [];
        const u37s: unknown[] = [];
        for (const e of ents) {
          if (e.name === "*U37" || e.blockName === "*U37") {
            u37s.push({
              type: e.type,
              name: e.name,
              layer: e.layer,
              pos: e.position,
              matrix: e.blockTransform?.elements,
            });
          }
        }
        return {
          msEntCount: ents.length,
          u37Count: u37s.length,
          firstU37: u37s[0],
        };
      }).catch((e: unknown) => ({ error: e.message }));
      console.log("   V1 *U37 Bilgisi:", JSON.stringify(v1U37Info, null, 2));

    } catch (err: unknown) {
      console.error(`   Hata oluştu (${target.name}):`, err.message);
      fileResult.errors.push(err.message);
    }

    results.push(fileResult);
  }

  await browser.close();

  // Sonuç raporunu yaz
  const reportPath = path.resolve(process.cwd(), "tests/visual-inspection/inspection-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n=== İnceleme Tamamlandı. Rapor: ${reportPath} ===`);
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
