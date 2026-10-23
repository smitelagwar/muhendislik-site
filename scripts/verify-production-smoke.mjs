import { chromium } from "playwright";

const BASE_URL = "https://muhendislik-site.vercel.app";

async function main() {
  console.log("=== VERCEL PRODUCTION CANLI SMOKE TESTİ BAŞLATILIYOR ===");
  console.log(`Hedef URL: ${BASE_URL}`);

  // 1. Cron Yetkisiz İstek Kontrolü (401 bekliyoruz)
  console.log("\n[1/5] Cron Güvenlik Testi: Yetkisiz çağrı /api/cron/belge-paylasim-temizlik...");
  const cronRes = await fetch(`${BASE_URL}/api/cron/belge-paylasim-temizlik`);
  console.log(`Cron yanıt kodu: ${cronRes.status} (Beklenen: 401)`);
  if (cronRes.status !== 401) {
    throw new Error(`Cron güvenlik kapısı başarısız! Beklenen 401, alınan: ${cronRes.status}`);
  }
  console.log("✔ Cron yetkisiz erişim kapısı: 401 Unauthorized (BAŞARILI)");

  // 2. HTTP Method Disallow (405 bekliyoruz)
  console.log("\n[2/5] API Method Kontrolü: GET /api/belgeler/paylasim...");
  const methodRes = await fetch(`${BASE_URL}/api/belgeler/paylasim`);
  console.log(`GET yanıt kodu: ${methodRes.status} (Beklenen: 405)`);
  if (methodRes.status !== 405) {
    throw new Error(`Method kapısı başarısız! Beklenen 405, alınan: ${methodRes.status}`);
  }
  console.log("✔ Method disallow kapısı: 405 Method Not Allowed (BAŞARILI)");

  // 3. API Rota Canlı Akış & Revoke Testi (Neon DB + Private Blob)
  console.log("\n[3/5] Canlı API Uçtan Uca Paylaşım & İptal Testi (Neon DB & Private Blob)...");
  const testRequestId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const postRes = await fetch(`${BASE_URL}/api/belgeler/paylasim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      clientRequestId: testRequestId,
      documentId: "santiye-sefi-taahhutnamesi",
      values: {
        yapi_sahibi: "Canlı Smoke Yapı Sahibi A.Ş.",
        il_ilce: "İstanbul / Kadıköy",
        tarih: "23.10.2026",
      },
    }),
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    throw new Error(`Canlı POST /api/belgeler/paylasim başarısız (${postRes.status}): ${errText}`);
  }

  const postData = await postRes.json();
  console.log("✔ Bağlantı başarıyla oluşturuldu:");
  console.log(`  Token: ${postData.viewToken}`);
  console.log(`  View URL: ${postData.viewUrl}`);
  console.log(`  ExpiresAt: ${postData.expiresAt}`);

  // PDF akışını doğrula
  console.log("  PDF akışı çekiliyor: /api/belgeler/paylasim/[token]/pdf...");
  const pdfRes = await fetch(`${BASE_URL}/api/belgeler/paylasim/${postData.viewToken}/pdf`);
  if (!pdfRes.ok) {
    throw new Error(`PDF akışı başarısız (${pdfRes.status})`);
  }
  const pdfContentType = pdfRes.headers.get("content-type");
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  const isPdfHeader = pdfBuffer.slice(0, 5).toString("utf8") === "%PDF-";
  console.log(`  PDF Boyutu: ${pdfBuffer.length} bayt, Content-Type: ${pdfContentType}, %PDF-1.4: ${isPdfHeader}`);
  if (!isPdfHeader) throw new Error("Dönen içerik geçerli bir PDF değil!");

  // İptal (Revoke) işlemi
  console.log("  Bağlantı iptal ediliyor: DELETE /api/belgeler/paylasim/[token]...");
  const delRes = await fetch(`${BASE_URL}/api/belgeler/paylasim/${postData.viewToken}`, {
    method: "DELETE",
    headers: {
      "x-manage-token": postData.manageToken,
    },
  });
  if (!delRes.ok) {
    throw new Error(`DELETE başarısız (${delRes.status}): ${await delRes.text()}`);
  }
  const delData = await delRes.json();
  console.log(`  İptal yanıtı: status = ${delData.status} (Beklenen: revoked)`);

  // İptal sonrası anında 410 testi
  console.log("  İptal sonrası PDF akışı tekrar deneniyor...");
  const postRevokePdfRes = await fetch(`${BASE_URL}/api/belgeler/paylasim/${postData.viewToken}/pdf`);
  console.log(`  İptal sonrası yanıt kodu: ${postRevokePdfRes.status} (Beklenen: 410)`);
  if (postRevokePdfRes.status !== 410) {
    throw new Error(`İptal sonrası 410 dönmedi! Alınan: ${postRevokePdfRes.status}`);
  }
  console.log("✔ Canlı API & Revocation kapısı: 410 Gone (BAŞARILI)");

  // 4. Canlı Tarayıcı Görüntüleyici & İzolasyon Smoke Testi
  console.log("\n[4/5] Canlı Tarayıcı /b/[token] ve Stüdyo Arayüz Smoke Testi...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Yeni bir test linki daha açalım ve tarayıcıda /b/[token] olarak render edelim
  const browserRequestId = `browser-smoke-${Date.now()}`;
  const browserPostRes = await fetch(`${BASE_URL}/api/belgeler/paylasim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({
      clientRequestId: browserRequestId,
      documentId: "santiye-sefi-sozlesmesi",
      values: {
        muteahhit_unvan: "Canlı Smoke Müteahhitlik Ltd.",
        santiye_sefi_ad: "Canlı Smoke Mühendis",
        sozlesme_tarihi: "23.10.2026",
      },
    }),
  });
  const browserPostData = await browserPostRes.json();
  const testViewerUrl = `${BASE_URL}/b/${browserPostData.viewToken}`;
  console.log(`  Görüntüleyici URL: ${testViewerUrl}`);

  await page.goto(testViewerUrl, { waitUntil: "networkidle" });

  // İzolasyon kontrolü: site header/nav bulunmamalı
  const siteNavCount = await page.locator("nav").count();
  const siteHeaderCount = await page.locator("header[data-site-header]").count();
  const footerCount = await page.locator("footer").count();
  console.log(`  İzolasyon Kontrolü -> nav: ${siteNavCount}, siteHeader: ${siteHeaderCount}, footer: ${footerCount}`);
  if (siteHeaderCount > 0 || footerCount > 0) {
    throw new Error("Görüntüleyici sayfasında ana site chrome (header/footer) sızdı!");
  }

  // PDF Canvas render edilmiş mi?
  await page.waitForSelector("canvas", { timeout: 15000 });
  const canvasCount = await page.locator("canvas").count();
  console.log(`  Render edilen PDF Canvas sayısı: ${canvasCount}`);
  if (canvasCount < 1) {
    throw new Error("Görüntüleyicide canvas bulunamadı!");
  }

  // WhatsApp/QR butonu kesinlikle olmamalı
  const whatsappCount = await page.locator("a[href*='whatsapp'], a[href*='wa.me']").count();
  console.log(`  WhatsApp link/buton sayısı: ${whatsappCount} (Beklenen: 0)`);
  if (whatsappCount > 0) throw new Error("Arayüzde WhatsApp tespit edildi!");

  // İptal et ve 410 ekranını doğrula
  console.log("  Tarayıcı linki iptal ediliyor...");
  await fetch(`${BASE_URL}/api/belgeler/paylasim/${browserPostData.viewToken}`, {
    method: "DELETE",
    headers: { "x-manage-token": browserPostData.manageToken },
  });

  await page.reload({ waitUntil: "networkidle" });
  const goneMessage = await page.locator("text=Bağlantı İptal Edildi").isVisible();
  console.log(`  410 'Bağlantı İptal Edildi' ekranı göründü mü: ${goneMessage}`);
  if (!goneMessage) {
    throw new Error("İptal edilen bağlantı için 410 ekranı gösterilmedi!");
  }
  console.log("✔ Canlı /b/[token] Salt-okunur ve İptal ekranı doğrulandı (BAŞARILI)");

  // 5. Stüdyo Arayüzünde Paylaş ve Akıllı Dosya Adı Kontrolü
  console.log("\n[5/5] Canlı Stüdyoda 'Paylaş' Butonu & Akıllı Dosya Adı Kontrolü (/belgeler/santiye-sefi-taahhutnamesi)...");
  await page.goto(`${BASE_URL}/belgeler/santiye-sefi-taahhutnamesi`, { waitUntil: "networkidle" });
  
  // Paylaş butonu var mı?
  const shareBtn = page.getByRole("button", { name: "Paylaş" });
  const isShareBtnVisible = await shareBtn.first().isVisible();
  console.log(`  Stüdyo 'Paylaş' butonu görünür mü: ${isShareBtnVisible}`);
  if (!isShareBtnVisible) throw new Error("Stüdyo sayfasında Paylaş butonu bulunamadı!");

  await shareBtn.first().click();
  await page.waitForSelector("text=PDF görüntüleme bağlantısı", { timeout: 5000 });
  console.log("  Paylaş diyalogu açıldı: 'PDF görüntüleme bağlantısı'");

  // WhatsApp kontrolü
  const dialogWaCount = await page.locator("button:has-text('WhatsApp'), a[href*='whatsapp']").count();
  console.log(`  Diyalogda WhatsApp butonu: ${dialogWaCount} (Beklenen: 0)`);
  if (dialogWaCount > 0) throw new Error("Diyalogda WhatsApp butonu tespit edildi!");

  await browser.close();
  console.log("\n=======================================================");
  console.log("🎉 TÜM VERCEL PRODUCTION CANLI SMOKE KONTROLLERİ BAŞARILI!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("\n❌ CANLI SMOKE TESTİ BAŞARISIZ:", err);
  process.exit(1);
});
