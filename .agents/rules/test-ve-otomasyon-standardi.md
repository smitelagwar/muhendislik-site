# Test ve Otomasyon Doğrulama Standardı (Takılma Önleme Kuralı)

> **ZORUNLU KURAL:** Proje üzerinde Playwright, Node.js, tarayıcı duman testleri, doğrulama veya geçici inceleme (`scratch-*.mjs`) scriptleri yazan ve çalıştıran **tüm AI ajanları** (Antigravity, Gemini, ChatGPT, Claude vb.) bu standarda uymak zorundadır.

---

## 1. Temel İlke: Hiçbir Test Asılı (Hanging) Kalamaz

Otomasyon ve doğrulama scriptlerinin terminalde takılı kalması, arka plan görevlerinin birikmesi ve kullanıcının beklemesi **kesinlikle yasaktır**.

### Kök Neden Analizi (Testler Neden Takılır?)
1. **Kapatılmayan Tarayıcı Oturumu:** `main().catch(console.error)` yazıldığında, `try` bloğu içinde bir hata (TypeError, Selector Timeout vb.) oluşursa kod `catch` bloğuna düşer ancak `browser.close()` çağrılmadığı için Chromium arka planda açık kalır. Node.js event loop'u aktif handle'lar yüzünden kapanamaz.
2. **Eksik `process.exit()`:** İşlem bitse dahi arka planda açık kalan WebSocket/IPC kanalları process'in terminate olmasını engeller.
3. **Tahminî / Yanlış Seçiciler:** Kod incelenmeden tahminle yazılan `aria-label` veya `text` seçicileri uzun timeout'lara düşerek gereksiz süre tüketir.

---

## 2. Zorunlu Test Script Şablonu

Yazılan her bağımsız doğrulama veya Playwright scripti **istisnasız** şu mimariyi uygulamalıdır:

```javascript
import { chromium } from "playwright";

async function main() {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });

    // 1. Makul timeout ile sayfaya git
    await page.goto("http://localhost:3000/...", { timeout: 45000 });

    // 2. Hazır olma koşulunu bekle (en fazla 30-45 sn)
    await page.waitForFunction(() => !!window.__cadAdapter, { timeout: 30000 });

    // 3. Test adımlarını kesin data-testid seçicileriyle çalıştır
    const btn = page.locator('[data-testid="cad-tool-distance"]').first();
    await btn.waitFor({ state: "visible", timeout: 8000 });
    await btn.click();

    // 4. Doğrulamaları yap ve ekran görüntüsü al
    // ...

    console.log("✅ Test başarıyla tamamlandı.");
  } catch (err) {
    console.error("❌ Test hatası:", err);
    process.exitCode = 1;
  } finally {
    // ZORUNLU: Hata olsa da olmasa da tarayıcı MUTLAKA kapatılır
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Tarayıcı kapatma hatası:", closeErr);
      }
    }
    // ZORUNLU: Node.js sürecinin asılı kalması engellenir
    process.exit(process.exitCode || 0);
  }
}

main();
```

---

## 3. Seçici (Selector) Kuralları

1. **Önce Kaynak Kodu İncele:** Test edilecek buton veya girdi elemanının gerçek kaynak koduna bakmadan asla tahminî `aria-label` veya `title` yazma.
2. **`data-testid` Önceliği:** Varsa her zaman `[data-testid="..."]` seçicisini kullan (ör. `data-testid="cad-tool-distance"`).
3. **Kısa Timeout'lar:** Eleman bekleme süreleri en fazla 8.000 ms olmalıdır. 30 saniye boyunca bulunamayan bir buton zaten hatalıdır; testi erkenden fail ettirip asılı kalmasını önle.

---

## 4. Görev ve Süreç Yönetimi

- `run_command` ile bir test çalıştırılırken `WaitMsBeforeAsync` değeri testin beklenen süresine göre (ör. 20000 - 40000 ms) ayarlanmalıdır.
- Eğer bir görev beklenmedik şekilde arka planda asılı kalırsa:
  1. Ajan derhal `manage_task(Action='kill')` çağırarak süreci sonlandırmalıdır.
  2. Kullanıcıyı bekletmeden hatanın logunu okumalı ve scripti yukarıdaki `finally { await browser.close(); process.exit(); }` standardına getirmelidir.
- Test tamamlandıktan sonra oluşturulan geçici `scratch-*.mjs` dosyaları derhal silinmelidir.
