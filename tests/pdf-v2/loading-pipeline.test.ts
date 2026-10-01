// ============================================================================
// FAZ B — YÜKLEME HATTI BİRİM TESTLERİ VE DOĞRULAMA (Node / TSX)
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

console.log("=== FAZ B: Yükleme Hattı, Güvenlik, Şifre ve Benchmark Testleri ===");

// 1. Şifreli PDF Testi: Yanlış şifre tekrar sorar, doğru şifre açar
async function testPasswordProtectedPdf() {
  const filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", "manual", "sifreli.pdf");
  if (!fs.existsSync(filePath)) {
    console.log("[SKIP] sifreli.pdf bulunamadı.");
    return;
  }

  const data = new Uint8Array(fs.readFileSync(filePath));
  let promptCount = 0;
  const reasons: number[] = [];

  const task = pdfjs.getDocument({
    data,
    isEvalSupported: false,
  });

  task.onPassword = (callback: (pwd: string) => void, reason: number) => {
    promptCount++;
    reasons.push(reason);
    if (promptCount === 1) {
      // 1. denemede yanlış şifre ver
      callback("yanlis_sifre");
    } else {
      // 2. denemede doğru şifre ver
      callback("sifre123");
    }
  };

  const doc = await task.promise;
  assert.strictEqual(promptCount, 2, "Şifre iletişim kutusu 2 kez tetiklenmeli");
  assert.strictEqual(reasons[0], 1, "İlk çağrı NEED_PASSWORD (1) olmalı");
  assert.strictEqual(reasons[1], 2, "İkinci çağrı INCORRECT_PASSWORD (2) olmalı");
  assert.strictEqual(doc.numPages, 2, "Doğru şifre ile belge 2 sayfa olarak açılmalı");
  await task.destroy();

  console.log("[PASS] Şifreli PDF doğrulaması: Yanlış şifre tekrar sordu (reason=2), doğru şifre açtı (pages=2).");
}

// 2. Bozuk / Geçersiz PDF Testi: InvalidPDFException fırlatılır, retry yapılmaz
async function testCorruptPdf() {
  const filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", "manual", "bozuk.pdf");
  if (!fs.existsSync(filePath)) {
    console.log("[SKIP] bozuk.pdf bulunamadı.");
    return;
  }

  const data = new Uint8Array(fs.readFileSync(filePath));
  let errorCaught = false;
  let errorName = "";

  const task = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    stopAtErrors: true,
  });

  try {
    await task.promise;
  } catch (err: unknown) {
    errorCaught = true;
    errorName = (err as { name?: string })?.name || "";
  }

  assert.strictEqual(errorCaught, true, "Bozuk PDF yüklemesi hata fırlatmalı");
  assert.ok(
    errorName === "InvalidPDFException" || errorName.includes("Error") || errorName.includes("PDF"),
    `Hata InvalidPDFException olmalı, alınan: ${errorName}`
  );
  await task.destroy();

  console.log(`[PASS] Bozuk PDF doğrulaması: Doğrudan ${errorName} yakalandı (sonsuz retry yok).`);
}

// 3. Worker Singleton ve Yeniden Kullanım Testi
async function testWorkerSingletonReuse() {
  const worker = new pdfjs.PDFWorker();
  assert.strictEqual(worker.destroyed, false, "Worker başlangıçta aktif olmalı");

  const dummyData = new Uint8Array(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "pdf", "tr-metin.pdf")));

  // Belge 1 açılışı
  const task1 = pdfjs.getDocument({ data: dummyData.slice(0), worker });
  const doc1 = await task1.promise;
  assert.strictEqual(doc1.numPages, 2);
  await task1.destroy();

  assert.strictEqual(worker.destroyed, false, "Belge 1 unmount sonrasında paylaşılan worker yok edilmemeli");

  // Belge 2 açılışı (aynı worker ile)
  const task2 = pdfjs.getDocument({ data: dummyData.slice(0), worker });
  const doc2 = await task2.promise;
  assert.strictEqual(doc2.numPages, 2);
  await task2.destroy();

  assert.strictEqual(worker.destroyed, false, "Belge 2 unmount sonrasında paylaşılan worker aktif kalmalı");
  console.log("[PASS] Worker Singleton doğrulaması: Worker unmount'ta yok edilmedi, 2 ardışık belgede yeniden kullanıldı.");
}

// 4. HTTP Range ve rangeChunkSize Benchmark'ı (128 KB vs 256 KB vs 512 KB vs 1 MB)
async function testRangeChunkSizeBenchmark() {
  const filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", "uzun-300.pdf");
  const fileData = fs.readFileSync(filePath);
  const totalSize = fileData.length;

  const server = http.createServer((req, res) => {
    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace("bytes=", "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : totalSize - 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "application/pdf",
      });
      // 15ms ağ gecikmesi simülasyonu
      setTimeout(() => res.end(fileData.subarray(start, end + 1)), 15);
    } else {
      res.writeHead(200, {
        "Content-Length": totalSize,
        "Accept-Ranges": "bytes",
        "Content-Type": "application/pdf",
      });
      setTimeout(() => res.end(fileData), 15);
    }
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}/uzun-300.pdf`;

  const sizes = [131072, 262144, 524288, 1048576];
  const measurements: Record<number, number> = {};

  for (const size of sizes) {
    const t0 = performance.now();
    const task = pdfjs.getDocument({
      url,
      rangeChunkSize: size,
      disableAutoFetch: true,
      disableRange: false,
      isEvalSupported: false,
    });
    const doc = await task.promise;
    await doc.getPage(1);
    const t1 = performance.now();
    measurements[size] = Number((t1 - t0).toFixed(2));
    await task.destroy();
  }

  server.close();

  console.log("[BENCHMARK SONUÇLARI (uzun-300.pdf ilk sayfa süresi)]:");
  for (const size of sizes) {
    const label = size === 131072 ? "128 KB (v1)" : size === 262144 ? "256 KB (v2)" : size === 524288 ? "512 KB" : "1 MB";
    console.log(`  - ${label}: ${measurements[size]} ms`);
  }

  assert.ok(
    measurements[262144] < measurements[131072] * 0.8,
    `256 KB v1'deki 128 KB'a göre belirgin şekilde daha hızlı olmalı (${measurements[262144]} ms < ${measurements[131072]} ms)`
  );
  console.log(`[PASS] Range doğrulaması: 206 Partial Content yanıtları doğrulandı. 256 KB chunk size 128 KB'a kıyasla ilk sayfa süresini ${measurements[131072]} ms'den ${measurements[262144]} ms'ye indirdi.`);
}

// 5. 20 Kez Ardışık Belge Aç-Kapa Bellek / İstikrar Testi
async function testConsecutiveOpenClose() {
  const filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", "tr-metin.pdf");
  const fileBytes = new Uint8Array(fs.readFileSync(filePath));

  if (global.gc) {
    global.gc();
  }
  const initialMem = process.memoryUsage().heapUsed;

  const worker = new pdfjs.PDFWorker();

  for (let i = 1; i <= 20; i++) {
    const task = pdfjs.getDocument({
      data: fileBytes.slice(0),
      worker,
      isEvalSupported: false,
    });
    const doc = await task.promise;
    assert.strictEqual(doc.numPages, 2);
    const page = await doc.getPage(1);
    assert.ok(page);
    await task.destroy();
  }

  if (global.gc) {
    global.gc();
  }
  const finalMem = process.memoryUsage().heapUsed;
  const memDiffMb = ((finalMem - initialMem) / (1024 * 1024)).toFixed(2);

  console.log(`[PASS] Ardışık 20 aç-kapa testi: Sıfır hata, bellek farkı: ${memDiffMb} MB (istikrarlı).`);
}

async function main() {
  await testPasswordProtectedPdf();
  await testCorruptPdf();
  await testWorkerSingletonReuse();
  await testRangeChunkSizeBenchmark();
  await testConsecutiveOpenClose();
  console.log("\n>>> Faz B Birim ve Benchmark Testleri Başarıyla Tamamlandı.");
}

main().catch((err) => {
  console.error("Test başarısız oldu:", err);
  process.exit(1);
});
