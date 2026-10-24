import { chromium } from "playwright";

const LIVE_URL = "https://muhendislik-site.vercel.app/belgeler";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  console.log(`[Smoke] Canlı URL test ediliyor: ${LIVE_URL}`);
  const response = await page.goto(LIVE_URL, { waitUntil: "networkidle", timeout: 30000 });
  console.log(`[Smoke] HTTP Status: ${response.status()}`);

  // 1. Katalog doğrulaması
  await page.waitForSelector('input[type="search"], input[placeholder*="ara"]', { timeout: 10000 });
  console.log("[Smoke] Arama kutusu hazır.");

  // 2. Arama testi
  const searchInput = page.locator('input[type="search"], input[placeholder*="ara"]').first();
  await searchInput.fill("beton");
  await page.waitForTimeout(300);
  const cardCount = await page.locator('a[href^="/belgeler/"]').count();
  console.log(`[Smoke] 'beton' araması sonrası kart sayısı: ${cardCount}`);

  // 3. Bir stüdyo rotasına tıklama
  console.log("[Smoke] İlk stüdyo rotasına gidiliyor...");
  await page.click('a[href="/belgeler/beton-dokum-tutanagi"]');
  await page.waitForSelector('canvas', { timeout: 15000 });
  console.log("[Smoke] Canlı PDF canvas hazır duruma geçti!");

  // 4. Geri dönüş
  const backLink = page.locator('a[aria-label="Tüm belgelere dön"]');
  await backLink.click();
  await page.waitForSelector('a[href="/belgeler/beton-dokum-tutanagi"]', { timeout: 10000 });
  console.log("[Smoke] Kataloğa dönüş başarılı!");

  await browser.close();
  console.log("[Smoke] Canlı Production smoke testi %100 BAŞARILI!");
}

main().catch((err) => {
  console.error("[Smoke] Hata:", err);
  process.exit(1);
});
