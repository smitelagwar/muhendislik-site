# Form → PDF alan odağı — son denetim ve düzeltme

Tarih: 23 Ekim 2026. İncelenen/test edilen kaynak: `9cf0a95e819e1b545791c8ac7184a051758d1835` + mevcut yerel Gemini düzeltmeleri + bu denetimdeki Codex düzeltmeleri. Kaynak commit edilmedi; kullanıcıya ait başlangıç değişiklikleri korundu.

**Sonuç:** Test edilen ürün kapsamında kalan hatalar düzeltildi ve yeni production derlemesinde doğrulandı. Yeni plan veya yayın adımı yok. Commit, push veya deploy yapılmadı.

## Son denetimde kapatılan açıklar

1. Geometri çıkarımının başarısız ilk denemesinde belge kimliği kaydedilmediği için deneme sınırı uygulanmıyordu. Kalıcı hata, her PDF revizyonunda tekrar deneniyordu. Bütçe artık belge/oturum kapsamında korunur; geçici hatada aynı PDF üzerinde tek ek deneme yapılır.
2. İlk PDF'nin annotation işlemi gecikince yeni PDF'nin çıkarımı kaybolabiliyordu. Yeni PDF, eski/iptal edilmiş isteğin bitmesini beklemez. Eski sonuç ve eski `finally`, yeni state/cache/işlem kaydını değiştiremez.
3. Bazı alanları eksik bir sonuç kalıcı cache başarısı sayılabiliyordu. Artık yalnız allowlist'in tamamını içeren geometri cache'lenir; kısmi doğrulanmış alanlar gösterilebilir ve deneme bütçesi korunur.
4. Mobil forma dönüş, tüketilmiş seçim kimliğini sıfırlayıp yeni odak olmadan eski alanı tekrar parlatıyordu. Seçim başına tek gösterim korunur.
5. `clearEventId`, yeni `FOCUS`/`SET_FIELD` dönüşlerinde kayboluyordu. Yeni seçimler iptal sayacını korur; sonraki iptal monoton artar. Bekleyen masaüstü reveal kaydı da belge/alan/odak/iptal kimliğine bağlandı; iptal veya başka seçimden sonra gecikmiş scroll uygulanmaz.
6. %50/%400 zoom sınırlarında odaklı düğmenin disabled olması odağı body'ye düşürüp rehberi siliyordu. Bu teknik blur, korunmuş PDF seçimini artık temizlemez.
7. 56 alan testi hâlâ elle kopyalanmış koordinatları ve normalize style değerlerini karşılaştırıyordu. Beklenen geometri artık önizlemenin gerçekten üretilmiş PDF blob'undan, ürün mapper'ını kullanmadan PDF.js ile ölçülür. Bütün alanlarda sayfa, left/top/width/height ve ≤2 CSS px konum hatası doğrulanır.
8. Bazı birim testleri gerçek bileşen yerine testin içinde yazılmış cache/timer mantığını sınamaktaydı. Bunlar gerçek tarayıcı fault-injection/lifecycle testleriyle değiştirildi. “Farklı içerikli üretilmiş PDF” testi de aynı dosyayı iki kez okumak yerine beş belgeyi kısa ve uzun içerikle ayrı ayrı üretir.
9. Smoke script'ine beklenmeyen tarayıcı/HTTP/istek hatası denetimi ve kapanış sırasında da geçerli süre koruması eklendi. `SMOKE_EVIDENCE_DIR` ile yerel testler tarihsel production görsellerinin üzerine yazmaz.

İlk üç cache kusuru ürün düzeltmesinden önce gerçek tarayıcıda kırmızı testlerle doğrulandı. Zoom sınırı hatası da gerçek %50 seçimi sırasında yeniden üretildi. Assertion/tolerans gevşetilmedi; yeni paket eklenmedi; PDF üretim motoru ve şablonlar değiştirilmedi.

## Son doğrulama

Production BUILD_ID: **`yBouNDP-SHr6m4GN97fDH`**. Yeni `npm run build` çıktısı, yalnız bu görev için açılan `http://127.0.0.1:3015` sunucusunda test edildi; eski sunucu/artifact kullanılmadı.

| Kontrol | Gerçek sonuç |
| --- | --- |
| Değişen kaynak/test/script dosyalarında ESLint + `git diff --check` | PASS, hata/uyarı yok |
| Production kaynak TypeScript kontrolü (`tsconfig.next.json`) | PASS; production build'in typecheck'i de PASS |
| Düzenlenen kaynak ve odak testlerinin kapsamlı TS kontrolü | PASS; geçici config kontrol sonrası kaldırıldı |
| `npm run check:belgeler-pdf` | **144/144 PASS**, 26 suite; altı sayfanın görsel koruması PASS |
| Yeni production build | PASS |
| `belgeler-field-focus.spec.ts` + `belgeler-field-focus-regressions.spec.ts`, 1366 ve 1920 projeleri | **54/54 PASS**, 2,9 dk |
| Mevcut desktop inline edit + PDF quality | **33 PASS** |
| Mevcut mobil inline edit, gerçek touch context | **9/9 PASS** |
| Yerel smoke: Beton yer/tarih, Sözleşme sayfa 2, mobil flash/kapanma | PASS |
| Olumsuz smoke: 404 rota | Beklenen **exit 1**; başarı satırı yok |

Odak kabul paketi 56 alanı; 320/360/390/430/768 mobil boyutlarını; yavaş render ve annotation'ı; ilk transient hata, kısmi geometri ve kalıcı hata sınırını; manuel sayfa → yeni form seçimini; aynı alana dönüşü; Escape'i; yüksek DPR'yi; %50/%100/%200/%400 PDF zoom'unu; gerçek CDP touch pinch'i; iki tema/forced-colors/reduced-motion ve inline edit izolasyonunu kapsar. Beklenmeyen browser/HTTP hataları odak testlerini düşürür.

### Ayrı tutulan ortam/baseline sonuçları

- Genel `npx tsc --noEmit --incremental false` **FAIL**: değiştirilmemiş eski doküman örnekleri, ECC/Remotion bağımlılıkları ve CAD test/script tür hataları var. Örnekler: `docs/pdf-viewer-v4/ekler/...` eksik importları, ECC'de kurulu olmayan `remotion`, CAD debug script'lerinde `unknown` kullanımı. Bu kapsamın kaynak ve testleri ayrıca kontrol edilerek temizlendi; genel repo typecheck'i PASS diye sunulmuyor.
- Desktop regresyon çağrısına dahil olan iki eski `belgeler-stage05-native-zoom.spec.ts` senaryosu **ortam nedeniyle FAIL/BEKLIYOR**: Linux `xdotool` çağrısı Windows'ta `spawnSync xdotool ENOENT` veriyor. Aynı çağrıdaki 33 ürün testi geçti; komutun toplam exit code'u 1 idi. Bu iki kontrol atlanmış/PASS gibi sayılmadı. Doğrulanan PDF zoom, yüksek DPR ve touch pinch; işletim sistemindeki Chrome pencere zoom testiyle aynı kanıt değildir.
- Fiziksel telefon klavyesi ve fiziksel yazıcı testi yapılmadı; emülasyon/byte/gerçek touch-event kanıtı fiziksel cihaz PASS'i sayılmıyor.

Yerel ayrıntılı loglar ve smoke görselleri: `test-output/belgeler-focus-final/`. Kaynakta yaşayan davranış sözleşmesi `docs/BELGELER_SISTEMI.md` Bölüm 11'de güncellendi.

Bu kayıt yeni uygulama aşaması başlatmaz. Yerel düzeltme tamamlandı; yayın yapılmadı.
