# ASAMA_12 — PDF içeriği, dosya adı ve beş stüdyo uyumu

**PASS — yerel aşama kapısı.** Tarih: 2026-10-24 Europe/Istanbul. Branch `main`, başlangıç HEAD `04048e50fd02e50c1c9ea783acec2d7383f516b4`. Önceki aşamaların birikmiş değişiklikleri korundu. ASAMA_13 başlatılmadı.

## Uygulama

- `src/lib/belge-filename.ts`: YİBF dosya adı parçası tam yedi ASCII rakam ister, isteğe bağlı mevcut `YIBF` prefix biçimlerini tanır ve baştaki sıfırları korur. Geçersiz değerler veya sınıra sığmayan değerler yalnız filename'den çıkarılır. PDF form değeri sınırlandırılmaz. Tarih kontrolü ay/gün/yıl için sonlu tamsayı şartı koyar.
- `src/lib/belge-paylasim/server-pdf.ts`: PDF başlık/boyut kontrollerinden sonra gerçek parse yapılır; belgeye göre bir/iki sayfa ve AcroForm/widget bulunmaması doğrulanır. Hata kategorisi güvenli ve sabittir; hash yalnız doğrulama sonrasında hesaplanır. Geçersiz PDF'yi gerçek POST çağrısında upload etmeye çalışan fixture, 500 sonucu ve **0 Blob PUT** ile doğrulandı.
- `src/lib/pdf-engine.ts`: Flatten istisnası artık yutulmaz. `pdf-lib` flatten sonrasında yalnız çözülemeyen annotation referansları temizlenir; gerçek Widget kalırsa hata olur. Taahhütname şablonunda beyaz widget'ların örttüğü kırmızı FreeText yardım annotation'ları hem editable hem shared PDF'de yalnız dikdörtgen tamamen kapalı olduğunda kaldırılır. Böylece flatten sonrası kırmızı talimatların yeniden görünmesi ve PDF metninde gizli helper kopyaları önlendi.
- Mevcut onaylı beş şablon, fontlar ve golden fixture'lar değiştirilmedi. Beş stüdyo ürünü düzenleme kodu bu aşamada değiştirilmedi; gerçek UI akışlarında test edildi.

## Doğrulama sonuçları

| Kontrol | Sonuç | Kanıt |
|---|---:|---|
| Stage12 ve ilgili filename/field/PDF regresyonları | **55/55 PASS**, 9 suite, 0 fail / 0 skip | `ASAMA_12_tests.json`, `ASAMA_12_tests.tap` |
| Gerçek Next dev UI + Playwright, actual route/service/PDF generator köprüsü | **40/40 PASS**, 5 stüdyo × 8 kontrol, 0 fail / 0 skip | `ASAMA_12_browser.json`, `ASAMA_12_dev-server.log` |
| PDF editable/shared parity | **18/18 sayfa çifti PASS**; 6 approved golden sayfa ve 6 hayalet alan sayfası PASS; 30 PDF/36 gerçek render | `ASAMA_12_parity.json`, `ASAMA_12_pdfs/`, `ASAMA_12_visual-sheet.png` |
| Runtime TypeScript | **PASS**, `tsconfig.next.json`, 22,326 ms | `ASAMA_12_runtime-tsc.json`, `ASAMA_12_runtime-tsc.log` |
| ESLint | **PASS**, 0 warning, 43,672 ms | `ASAMA_12_lint.json`, `ASAMA_12_lint.log` |
| Diff/whitespace ve değişiklik manifesti | PASS | `ASAMA_12_diff-check.log`, `ASAMA_12_changes.json` |

PDF matrisi beton, taahhütname, istifa, ruhsat ve sözleşmenin boş/örnek/Türkçe-uzun fixture'larını kapsar; sözleşmede iki sayfa doğrulanır. Editable PDF'lerde profil alanları ve değerleri, sayfa sayısı, taze appearance (`AP`) ve uygun `V`/`DV` kontrol edilir. Shared PDF'ler parse edilir, beklenen sayfaları taşır, form/widget içermez. Editable/shared çıkarılmış metni aynıdır. Aynı render çiftlerinde kanal farkı 12 üstünde en çok 52 piksel değişti (yaklaşık 2 milyon pikselde %0,0026); planın %0,01 eşiği aşılmadı. Approved render'larda mevcut istifa contact-mask bölgeleri dışında değişiklik yoktu. Blank → uzun → blank üretiminde altı sayfada hayalet içerik görülmedi. PDF binary hash'lerinin aynı olması beklenmedi; mevcut golden dosyaları değiştirilmedi.

Browser akışı beş gerçek stüdyo ekranında inline son düzenlemenin paylaşım PDF'sine girmesini, indirilen tüm alan değerlerini ve filename/focus davranışını, debounce sırasında download kilidini, ikinci share revision'ını, önceki link PDF baytlarının değişmemesini, temizle/geri alı, izinli taslak kaydet/yenile/geri yükle ve editable indir, alan odağı/form-fit ve güncel Blob'un yazdırma penceresine teslimini kontrol etti. Gerçek API route, kota ve PDF oluşturma fonksiyonları çağrıldı; DB/Blob bellek adaptörleri kullanıldı ve Playwright HTTP paylaşım taşıması test köprüsüne intercept edildi. Yazdırma testi kontrollü pencere stub'ıdır, işletim sistemi print dialog'u değildir.

## Görsel sınır ve tekrar koşusu

Poppler ile üretilen contact sheet ve temsilî boş/uzun sayfalar görsel olarak incelendi. Uzun sözleşme fixture'ında en küçük ölçülen alan fontu yaklaşık **1,663 pt**'dir; metin korunuyor ve hesaplanan geometri taşmıyor, fakat bu boyut pratikte zor okunabilir. Stage 12 planı min font eşiği tanımlamadığı için parity sonucu PASS'tir; okunabilirlik iddiası yapılmıyor ve **F09 açık kalıyor**. `ASAMA_12_parity.json` her alanın ölçülen font boyutunu kaydeder.

İlk browser başlatımı ilk assertion'dan önce `waitForFunction` için 8 saniye zaman aşımına uğradı; bu başarısız girişim `ASAMA_12_browser-initial-failure.json` içinde korundu. Koşucuya aşama bağlamı eklenip tüm beş stüdyo ile tekrar çalıştırıldı; son `ASAMA_12_browser.json` **40/40 PASS** kaydeder. Başarısız ilk girişim PASS olarak sayılmadı.

## Sınırlar ve sonraki aşama

**NOT_RUN:** tam proje production build'i ve Stage 13 bütünleşik release matrisi; gerçek Neon/PostgreSQL ayrı bağlantı concurrency; private Vercel Blob/runtime ve deployment; fiziksel Android/iOS; Firefox/WebKit; production kapasite/maliyet ve eski deployment rollout kontrolleri. Browser testindeki Next sunucusu development modundadır; route taşıması gerçek route/service fonksiyon çağrısı olsa da gerçek HTTP backend/Neon/Blob E2E'si değildir.

Bu aşamada fetch, remote write, commit, push, deployment veya canlı cron çalıştırılmadı. Engeller: yok. Kapatılan bulgular: **F11** filename YİBF, **F18 yerel** görsel parity, **N15 yerel** parse/sayfa/form doğrulaması. F09 ve dış release kapıları açık kalır. Sonraki tek aşama **ASAMA_13**; başlatılmadı.
