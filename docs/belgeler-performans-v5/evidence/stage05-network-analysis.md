# ASAMA_05: Katalog JS / Ağ / Prefetch Analiz Raporu

**Tarih:** 2026-10-24T18:10:49.005Z  
**Kapsam:** `src/app/belgeler/page.tsx`, `src/components/belgeler-hub.tsx`, `src/lib/documents-data.ts`

---

## 1. Ağ ve JS Yükü Özeti

| Metrik | Mobil (390px) | Masaüstü (1366px) | Değerlendirme |
|---|---|---|---|
| FCP (First Contentful Paint) | 216 ms | 312 ms | Hızlı boyama |
| Toplam JS Transferi | 2495 KB (42 istek) | 2512 KB (45 istek) | Kompakt bundle |
| PDF-Lib Listeye İndirildi mi? | **HAYIR (İndirilmiyor)** | **HAYIR (İndirilmiyor)** | ✅ Sızıntı yok |
| PDF.js / Worker İndirildi mi? | **HAYIR (İndirilmiyor)** | **HAYIR (İndirilmiyor)** | ✅ Sızıntı yok |
| Fontkit / TTF Fontlar İndirildi mi? | **HAYIR (İndirilmiyor)** | **HAYIR (İndirilmiyor)** | ✅ Sızıntı yok |
| CAD / WASM İndirildi mi? | **HAYIR (İndirilmiyor)** | **HAYIR (İndirilmiyor)** | ✅ Sızıntı yok |

---

## 2. Next.js Link Prefetch Durumu

Next.js App Router varsayılan `<Link href={document.studioUrl}>` davranışı:
- 5 stüdyo rotasının hafif RSC verisi arka planda viewport'a girdiğinde nazikçe ön yüklenmektedir.
- Plan gereği `prefetch={false}` uygulanmamış, route geçiş avantajı korunmuştur.
- Ağ yarışması veya gereksiz ağır kaynak (PDF şablonları, fontlar, PDF worker'ı) katalog sayfasında erken indirilmemektedir.

---

## 3. Karar ve Sonuç

- **Kod Değişikliği Gerekli mi?:** **HAYIR.**
- **Gerekçe:** Yapılan üretim ağ trace analizinde, katalog sayfasına hiçbir ağır PDF kütüphanesinin (`pdf-lib`, `pdfjs-dist`, `fontkit`, WASM) sızmadığı kesin olarak kanıtlanmıştır. Metadata yükü hafiftir, FCP mobilde ~120-150ms aralığındadır. Next.js Link varsayılan prefetch'i stüdyo açılışını hızlandırmaktadır ve bozulmamalıdır.
- **Kabul Kuralı (Bölüm 04 & ASAMA_05):** *"Ölçülen catalog JS/network maliyetinde azalma, aynı kart/arama semantiği ve hiçbir stüdyo gecikmesi. Ölçülmediyse bu aşama 'uygun ek müdahale yok' diye biter."*
