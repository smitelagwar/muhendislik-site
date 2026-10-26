# hsynCAD — kullanım ve doğrulama

Rota: `/kategori/araclar/hsyncad`. Kaynak: `src/components/hsyncad`, `src/lib/hsyncad`.

## Kullanım

1. Araçlar bölümünde **hsynCAD** kartını açın. Boş başlayın veya **Ölçülü örnekle başla** düğmesini kullanın.
2. Giriş sekmesinde Aks/Kolon/Kiriş/Perde/Döşeme seçin; boyutları metre olarak girin. Kolon tek merkez, aks/kiriş/perde iki nokta, döşeme köşeler + **Döşemeyi tamamla** ile oluşturulur. Döşemede Enter veya ilk köşeye dönmek de tamamlar.
3. Noktaları planda tıklayın. Hassas mutlak konum için yüzen koordinat kutusuna X/Y girip **Nokta ekle** seçin; komut satırına `4 0` da yazılabilir. Ondalık ayırıcı olarak koordinatlarda nokta veya virgül kabul edilir.
4. **Seç** ile 2B/3B'den seçim yapın; Özellikler panelinden kesit, yükseklik, konum, kat veya malzemeyi değiştirip **Değişiklikleri uygula** seçin. **Taşı** için seçili elemanla başlangıç ve hedef koordinatını belirtin. **Sil**, Ctrl+Z/Geri al ve Yinele kullanılabilir.
5. **Katlar** sekmesinden kat ekleyin, kot/yüksekliği düzenleyin. Üstteki kat seçicisi yalnız 2B aktif katı değiştirir. **Görünüm** sekmesindeki katman kutuları hem 2B hem 3B görünürlüğünü kontrol eder; metraj tüm katları içerir.
6. 2B'de tekerlek yakınlaştırır; **Kaydır** ile sürükleyin. Dokunmatikte iki parmakla yakınlaştırma/kaydırma, 3B'de tek parmakla döndürme vardır. **JSON kaydet** yerel dosya indirir; **Model aç** bu dosyayı doğrulayarak yükler. Otomatik tarayıcı kaydı ayrı bir yedek yerine geçmez.

## Elle karşılaştırılan 4 × 4 m örnek

Zemin kotu 0, kat yüksekliği 3 m. Dört köşe kolon 0,40 × 0,40 × 3 m; dört çevre kirişi 4 × 0,25 × 0,50 m; ortada 4 × 0,20 × 3 m perde; 4 × 4 × 0,15 m döşeme. Kiriş/döşeme üstü 3 m. Akslar metraja dahil değildir.

| Eleman | Brüt beton m³ | Net beton m³ | Brüt kalıp m² |
| --- | ---: | ---: | ---: |
| 4 kolon | 4 × 0,40 × 0,40 × 3 = 1,9200 | 1,9200 | 4 × 1,60 × 3 = 19,20 |
| 4 kiriş | 4 × 4 × 0,25 × 0,50 = 2,0000 | 1,7750 | 4 × [(0,25 + 2 × 0,50) × 4 + 2 × 0,25 × 0,50] = 21,00 |
| 1 perde | 4 × 0,20 × 3 = 2,4000 | 2,4000 | 2 × (4 + 0,20) × 3 = 25,20 |
| 1 döşeme | 4 × 4 × 0,15 = 2,4000 | 1,9935 | 16 + 16 × 0,15 = 18,40 |
| **Toplam** | **8,7200** | **8,0885** | **83,80** |

Kiriş–kolon düşümü: `4 × (2 × 0,20 × 0,25 × 0,50) = 0,20 m³`.
Kiriş–perde ek düşümü: `2 × (0,125 × 0,20 × 0,50) = 0,025 m³`.
Döşeme üst katmanında kolon 0,16 m², perde 0,80 m², bu ikisi dışındaki kirişler 1,75 m² alan kaplar; `(0,16+0,80+1,75) × 0,15 = 0,4065 m³` düşülür.
Toplam düşüm `0,20+0,025+0,4065=0,6315 m³`; net `8,72−0,6315=8,0885 m³`. Arayüz üç ondalıkta **8,089 m³** gösterir. Kalıp birleşim temas alanları düşülmediği için **brüt** olarak etiketlidir.

## Tekrarlanabilir kontroller

```powershell
npx tsx --test src/lib/hsyncad/model.test.ts tests/hsyncad/editor-state.test.ts
npx tsc --noEmit --incremental false -p tsconfig.next.json
npx eslint src/components/hsyncad src/lib/hsyncad src/app/kategori/araclar/hsyncad tests/hsyncad playwright.hsyncad.config.ts
npx tsx scripts/check-tools-inventory.ts
npx tsx scripts/check-tools-metadata.ts
npx tsx scripts/check-tools-registry.ts
npm run build
```

Tarayıcı testi için ayrı terminalde `npm run dev -- --port 3127 --hostname 127.0.0.1`, ardından `npx playwright test --config=playwright.hsyncad.config.ts`. `HSYNCAD_TEST_URL` başka yerel porta veya production build önizlemesine yönlendirebilir. Testler Vercel'e bağlanmaz; Playwright context/browser temizliğini yönetir, tek worker ve 300 saniye üst sınır vardır.

Kontrol kapsamı: bütün elemanların yerleştirilmesi; aks kesişimine snap; 2B/gerçek Three.js sahnesinin sayım ve geometri senkronu; özellik güncelleme, taşıma, silme/geri al/yinele; kat kotu; katman gizleme; masaüstü zoom/pan ve 3B orbit; geçersiz poligon/JSON reddi; JSON indir/yükle ve sayfa yenilemede kayıt; 390 px mobil gerçek iki parmak pinch/pan ve dokunarak yerleştirme; açık/koyu tema; Araçlar kartı ve mevcut Donatı Hesabı rotası.

## Son doğrulama — 26 Ekim 2026

| Kontrol | Sonuç |
| --- | --- |
| Model, geometri, snap, metraj, doğrulama, geçmiş | **14/14 test geçti** |
| Next uygulama TypeScript (`tsconfig.next.json`) | **Geçti, 0 hata**; hsynCAD kaynakları kontrol kapsamındadır |
| hsynCAD kaynakları, rotası ve testlerinin ESLint kontrolü | **Geçti, 0 hata / 0 uyarı** |
| Değişen mevcut katalog/registry/denetim dosyalarının ESLint kontrolü | **0 hata**, kullanılmayan mevcut import/parametreler için 6 uyarı |
| Araç envanteri, metadata ve registry | **Üç kontrol geçti, 31 araç** |
| `npm run build`, ayrı `.next-hsyncad-build` dizini | **Geçti**; hsynCAD statik rota olarak derlendi |
| Yerel geliştirme sunucusunda Playwright | **3/3 senaryo geçti (32,0 sn)** |
| Derlenmiş üretim sürümünde Playwright (`127.0.0.1:3128`) | **3/3 senaryo geçti (10,9 sn)** |
| Masaüstü / mobil görsel inceleme | 1440 px masaüstü ve 390 px mobil; açık/koyu tema, taşma ve dokunmatik kullanım kontrol edildi |
| Elle metraj karşılaştırması | **8,0885 m³ net beton / 83,80 m² brüt kalıp**, beklenen değerlerle aynı |

Tarayıcı senaryoları aks → kolon → kiriş → perde → döşeme sırasını, kesişim yakalamayı, ızgara dışındaki dik çizim başlangıcının korunmasını, gerçek 3B geometrinin değişmesini, düzenleme/taşıma/silme/geri alma/yinelemeyi ve mobil iki parmak hareketlerini kapsar. Araçlar kartından giriş ve mevcut **Donatı Alanı Hesabı** sayfası da doğrulandı. Test çıktıları `test-results/hsyncad` altındadır; bu klasör Git'e alınmaz.

**Depo genelindeki mevcut kalite borcu:** Çıplak `npm run lint` başarılı değildir: `.test-data/l11-hardware/...` altındaki eski derleme arşivleri ile mevcut kaynak/test dosyalarında toplam 8.921 hata ve 38.395 uyarı raporladı. Kök `npx tsc --noEmit --incremental false` de örneğin `docs/belgeler-paylasim-v3-uygulama/cleanup-stage14-preview.ts` ve eski `tests/document-studio` dosyalarında hata verir. Bu geniş kontroller hsynCAD'de hata raporlamadı; bağımsız Next uygulama typecheck'i ve üretim derlemesi geçti. Mevcut sayfalara/testlere toplu düzeltme uygulanmadı veya hatalar gizlenmedi. Yerel ayrıntılar `.tmp/hsyncad-full-lint.log` ve `.tmp/hsyncad-global-typecheck.log` içindedir. Dolayısıyla tüm deponun lint/typecheck'inin temiz olduğu iddia edilmez.

Vercel deploy, Git push veya ideCAD kurulum dosyalarında değişiklik yapılmadı.

## Yerelde açma

PowerShell'de:

```powershell
Set-Location 'C:\Users\hsyn\Desktop\muhendis-mimar-portali'
$env:NEXT_DIST_DIR='.next-hsyncad'
npm run dev -- --port 3127 --hostname 127.0.0.1
```

Ardından `http://127.0.0.1:3127/kategori/araclar` içindeki **hsynCAD** kartını açın. Doğrudan adres: `http://127.0.0.1:3127/kategori/araclar/hsyncad`. Bu yerel sürümdür; canlı Vercel sitesi henüz değiştirilmedi.
