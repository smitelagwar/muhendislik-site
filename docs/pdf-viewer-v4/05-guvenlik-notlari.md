# PDF Görüntüleyici v4 — Güvenlik ve Yapılandırma Denetim Notları (Plan 05 W8)

**Tarih:** 2026-10-07  
**Kapsam:** PDF görüntüleyici bileşenleri, veri akışı, harici bağlantılar, worker ve CSP yapılandırması.

---

## 1. Denetim Bulguları ve Değerlendirme

| # | Alan | Durum | Açıklama ve Kanıt |
|---|---|---|---|
| 1 | **Content Security Policy (CSP)** | ⚠️ Bilgi Notu | `next.config.ts` ve `vercel.json` dosyalarında şu an CSP tanımlı değildir. Gelecekte CSP eklenirse `worker-src 'self' blob:` ve pdf.js WASM (jbig2/openjpeg/qcms) için `'wasm-unsafe-eval'` direktifleri zorunludur; aksi halde taranmış ve sıkıştırılmış PDF'ler sessizce bozulur. |
| 2 | **pdf.js getDocument Güvenlik Bayrakları** |  Tamamlandı | `src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts` içinde `isEvalSupported: false`, `enableScripting: false`, `stopAtErrors: false` bayrakları zorunlu olarak geçirildi. PDF içi JavaScript script execution tamamen devre dışıdır. |
| 3 | **URL Güvenliği (`isSafePdfUrl`)** |  Tamamlandı | `src/lib/dokumantasyon/studio/pdf/pdf-navigation.ts` içinde `isSafePdfUrl` fonksiyonu `javascript:`, `data:`, `vbscript:`, `file:` şemalarını kesin olarak reddeder; yalnızca `http:`, `https:` ve `mailto:` protokollerine izin verir. |
| 4 | **Dış Bağlantılar (Annotation Layer Links)** |  Tamamlandı | `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx` içinde tüm dış bağlantılar `target="_blank"` ve `rel="noopener noreferrer"` özniteliklerine sahiptir. Tıklamada `event.stopPropagation()` çağrılarak olay sızıntısı önlenir. |
| 5 | **Statik Varlık Önbellek Başlıkları** |  Tamamlandı | `/vendor/pdfjs/*` statik kaynakları sürümlü ve `immutable` başlıklarla servis edilmektedir (`public/vendor/pdfjs/` izole yapısı). |
| 6 | **Bağımlılık Sabitlemesi** |  Tamamlandı | `package.json` içinde `pdfjs-dist` sürümü `3.11.174` legacy olarak sabitlenmiştir. |
| 7 | **Tanılama Gizliliği (W6)** |  Tamamlandı | `pdf-diagnostics.ts` içindeki `sanitizeErrorMsg` halka tamponuna yazılan hata mesajlarındaki tüm URL'leri (`[URL]`) ve token/key parametrelerini (`[REDACTED]`) temizler; belge içeriği veya adı asla kaydedilmez. |

---

## 2. Sonuç

Plan 05 W8 güvenlik denetimi başarıyla tamamlanmıştır. Herhangi bir kritik güvenlik açığı (XSS, script çalıştırma, token sızıntısı) tespit edilmemiştir.
