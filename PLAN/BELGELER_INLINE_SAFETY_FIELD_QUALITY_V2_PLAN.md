# BELGELER — PDF ÜZERİNDE DÜZENLEMEYİ KORUYARAK SAĞLAMLAŞTIRMA VE ALAN BAZLI KALİTE

**Plan kimliği:** `BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2`  
**Revizyon:** `2.0 — eleştirel mimari gözden geçirme sonrası nihai plan`  
**Plan tarihi:** 17 Ekim 2026  
**Hedef:** Windows'taki yerel `muhendis-mimar-portali` projesinde **Gemini 3.8 Flash (High)** ile aşamalı uygulama  
**Repo:** https://github.com/smitelagwar/muhendislik-site  
**İncelenen uzak `main`:** `14235bd4ff86f6d03f3a575d4650596cef57206e` (17.10.2026). Yerel dosyalar bundan farklı olabilir.  
**Kapsam:** Yalnız web sitesinin `/belgeler` altındaki **5 mevcut PDF stüdyosu**, bunların **56 düzenlenebilir alanı**, doğrudan PDF düzenleme katmanı, kullanıcıya gösterilen rehberlik ve ilişkili testler.  
**Yayın:** Son aşamada, bütün kalite kapıları geçerse yerel ortamdan **tek kontrollü `main` push → Vercel Production**; ara aşamalarda push/deploy yok.  
**Statü:** **PLAN HAZIR, UYGULAMA BAŞLAMADI.** Bu belgenin yazılması hiçbir site kodunu değiştirmez.

> **Birincil kural:** Çalışan PDF üretim sistemini riske atarak “daha iyi” bir doğrulayıcı veya görünüm üretme. Korunamayan davranış varsa kapsamı daralt, kanıtla, `ENGELLI` kaydet ve **DUR**. Kullanıcının girdisini izinsiz değiştirme. Sahte test başarısı veya kesinliği bilinmeyen “okunur” değerlendirmesi üretme.

---

## 0. Uygulayıcının asla ihlal etmeyeceği çalışma protokolü

1. **Kullanıcıya soru veya ara onay sorma.** Belirsizlikleri bu plandaki öncelik ve dar kapsamlı varsayılan davranışlarla çöz. Esaslı teknik çatışma çözülemiyorsa kullanıcıya soru yöneltmeden, kanıt ve güvenli seçenekle birlikte `ENGELLI` durumuna geçip dur.
2. Her ilk `başla`/`devam` **en fazla BİR** tamamlanmamış aşamayı gerçekleştirir. Aşama bitince test kanıtını, durum dosyasını kaydet, **dur ve yeni `devam` bekle**. Aşama başarısızsa sonraki aşamayı başlatma. `TAMAMLANDI` iken yeni yalnız `devam` mesajına “Plan tamamlandı; uygulanacak başka aşama yok.” yanıtını ver; **araç/kod/test/commit/deploy yok**.
3. Kaynak gerçekliği önceliklidir: başlangıçta `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/belgeler-kurallari.md`, `.agents/rules/test-ve-otomasyon-standardi.md`, ilgili `docs/BELGELER_SISTEMI.md`, güncel branch ve çalışma ağacını oku. Önceki tamamlanmış `PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md` dosyasına **dokunma**. Bu yeni işin durumu ayrı dosyada tutulur.
4. **İş mantığı ve motor sınırı:** `src/lib/pdf-engine.ts`, `src/hooks/use-belge-studio-document.ts`, `src/lib/document-field-contracts.ts`, `public/belgeler/*.pdf`, `src/lib/pdfjs-client.ts`, PDF.js worker/asset yolları, özgün PDF raster/zoom/pan/fit hesabı, şablon API'si, CAD/Dokümantasyon, backend, hesaplama motorları **dokunulmaz**. Plan bu dosyaları değiştirmeye yetki vermez. `belge-studio-pdf-preview.tsx` içinde yalnız ek katmanın **olay sınırı, durum/koordinat geçerlilik kontrolü, küçük entegrasyon** değişebilir; raster/zoom matematiğini yeniden yazma.
5. **Mevcut davranışlar:** Sol `formData` tek gerçek veri kaynağı; mevcut `handleFieldChange` ve bağlı imza kuralları, sol formu anlık doldurma, `Sıfırla`, `Temizle`, `Geri al`, PDF indir/yazdır/boş form, 2 sayfalı sözleşme, tema, mobil sekmeler, klavye/scroll, pinch/zoom/fit ve hata/retry aynen çalışmalı. Özellik **varsayılan OFF** kalır. OFF modda etkileşim katmanı mount edilmez ve annotasyon okumaları yapılmaz.
6. **Sessiz veri değişikliği yasak:** Otomatik `trim`, büyük harfe çevirme, kısaltma, tarih/telefon formatlama, karakter silme, `maxlength`, alandan satır/kelime atma, PDF'ye görünmez alternatif metin, otomatik özet, şablon/dilekçe hukuki içeriği değiştirme yok. Uyarılar **bilgilendirici**, hiçbir giriş/önizleme/indirme/yazdırma engellenmez. Kullanıcı gerçekten isterse kendi metnini kendisi düzenler.
7. **Gizlilik:** T.C. kimlik no, telefon, isim, adres, taslak ve PDF blob'unu console, test raporu, telemetri, URL veya başka sunucuya gönderme. Testlerde yalnız yapay/sentetik alan verileri kullan. Yeni API, depolama, abonelik, bağımlılık ve internet doğrulama servisi yok.
8. Kullanıcının mevcut kirli dosyalarını koru; kör `git reset --hard`, force push, rastgele `git checkout`, otomatik pull/merge, gereksiz formatlama, geniş refactor veya bağımsız yeni geliştirme yok. Her aşamada yalnız ilgili küçük diff.
9. **Testin gerçekten neyi test ettiğini söyle:** `page.setContent` ile yaratılan sahte editör, üretimdeki React bileşenini doğrulamaz. Kritik davranışlarda gerçek site rotasına giden Playwright + gerçek PDF bytes ve kod incelemesi gerekir. Test sonucu `PASS`, `FAIL`, `SKIP`, `ÇALIŞTIRILMADI` ayrımıyla raporlanır.
10. Öncelik sırası: **veri kaybı / eski sistemin bozulması > yanlış resmi belge riski > mobil etkileşim > çıktının okunabilirliği > yardımcı format uyarıları > kozmetik güzelleştirme**. Yeni bir güvenlik katmanı daha çok risk çıkarıyorsa onu ekleme.

---

## 1. Önceki planın eleştirel öz değerlendirmesi — neleri değiştirdim?

Bu bölüm “**Claude Opus 5.5 gibi dikkatli ve itiraz eden bir bağımsız kod gözden geçiricisi olsaydı hangi karşı örnekleri sorardı?**” düşünce deneyiyle yazıldı. **O modeli gerçekten çalıştırmadım; bu onun adına doğrulanmış görüş değildir.** Eleştiriler kaynak ve risk temellidir.

| Önceki karar / zaaf | Şüpheci itiraz | Nihai karar |
|---|---|---|
| “56 alana uyarı” ilkesi | Kullanışlı alanlar bile uyarı çöplüğüne dönebilir; yanlış pozitifler güveni azaltır. | **56 alanın hepsini incele, ama yalnız anlamlı doğrulamaya ihtiyaç duyulanlara müdahale et.** Saf registry tüm anahtarları kapsar; çoğu için sessiz `none`. |
| “PDF okunabilirliğini tahmin et” | Karakter uzunluğu gerçek fiziksel puntoyu vermez; `DA` değeri tek başına görünür metinle aynı şey olmayabilir. | Gerçek üretilmiş PDF'yi önce **offline ölç ve rasterize et**; runtime kesin ölçüm kanıtı yoksa yalnız “risk olabilir”. Varsayılan baskıda küçük fontlar için rastgele mutlak eşik kullanma. |
| `Uygula` öncesi UI'da değer karşılaştırması | React yeniden render'ı, çift onay ve ardışık update yarışını tek başına çözmez. | **Seçim anında donmuş değer + yazma noktasında koruma + tek onay**; mevcut form bağımlılıklarını kopyalamadan, saf updater/guard tasarımı. |
| Popup'ı sadece stopPropagation ile koru | Parent `touch-action:none`, pointer capture, blur ve React unmount hâlâ dokunmayı bozabilir. | **Önce gerçek touch ile kırmızı test.** Asgari child/parent olay sınırı; yetmezse yalnız editör portalı/stabil host. Motorun gesture matematiğini değiştirme. |
| Render tamamlanınca eski alanları sakla | Önceki sayfa/revision'ın koordinatları kısa aralıkta tıklanabilir kalabilir. | `snapshot revision + page + viewport/zoom/render request` **eşleşme şartı**; pending/error/geçişte fail-closed. |
| Her alana ayrı E2E indir/test | 56 ağır tarayıcı senaryosu gereksiz süre ve flaky test üretir. | **56/56 sözleşme ve gerçek PDF değer eşleşmesi** + beş gerçek UI rotasında temsili risk testleri + özel kritik alanlar; tüm 56 hotspot'un varlığı/anahtarı envanterle test edilir. |
| Otomatik kısaltma önermek | Resmî adresin anlamı değişebilir; kullanıcı yanlış resmi belge basabilir. | **Asla otomatik kısaltma yok**; kullanıcıya seçebileceği örnek kısaltmalar *metne uygulamadan* sunulur. Tam girdiyi göster ve riskin nerede olduğunu söyle. |
| “11 haneliyse T.C. geçerlidir” ifadesi | Matematiksel checksum, gerçek kişi ve resmî doğrulama değildir. | Durum “**biçim/kontrol basamağı tutarlı**”; doğrulandı/onaylandı etiketi yok. Aynı test değeri hiçbir gerçek kişiyle ilişkilendirilmez. |
| Kapsamlı yeni doğrulama ve uyarı UI'sı | Eski `BelgeFieldLengthWarnings` ile tekrarlı uyarı, default muafiyeti, dar ekranda karmaşa. | **Uyarı tekilleştirme**, varsayılanlar için ayrı politika, etkileşim sonrası yalnız gerektiğinde gösterim; eski bileşen geriye uyumlu kalır. |
| Başarılı build = güvenli yayın | Tarayıcı ve PDF içeriği hatası derleme sırasında görünmez. | Gerçek React + dokunmatik + gerçek PDF + yayın alias aynı SHA + canlı kabul; **READY tek başına yeterli değil**. |

**Çözümü kesin sınırlandıran gerçek:** Şantiye Şefi İstifa Dilekçesi `adres_deger` PDF widget'ı yaklaşık **192 × 18 pt** ve tek satır çıkıyor; fiziksel alanı koruyup sınırsız uzun adresi aynı zamanda normal puntoda basmak matematiksel olarak mümkün değil. Bu plan **PDF'yi sessizce bozmak yerine okunamaz baskıyı önceden görünür kılar ve kullanıcıya kontrol verir**. Şablon genişletmesi/yeni satır/ek sayfa ayrı açık bir değişikliktir; bu plan ona izin vermez.

---

## 2. Doğrulanan mimari ve yerelde sınanacaklar

**Doğrulandı (17.10.2026 `main`):**

- Beş belge: Beton Döküm Tutanağı **10**, İnşaat Ruhsatı Dilekçesi **8**, Şantiye Şefi İstifa Dilekçesi **10**, Şantiye Şefi Hizmet Sözleşmesi **14** (iki sayfa), Şantiye Şefi Taahhütnamesi **14**; **toplam 56** düzenlenebilir alan.
- Üç istifa `*_etiket` alanı PDF-only; taahhüt `FreeText` annotasyonları form alanı değil. `DOCUMENT_EDITABLE_FIELDS` ve `DOCUMENTS` metadata mevcut.
- `pdf-engine.ts` `populateForm` içinde PDF widget'ına uydurarak font görünümünü yeniden üretir, uzun tek satırı küçültebilir, orijinal alan değerini saklar; karakter bazlı sınır tek başına basım kalitesini ölçmez.
- `BelgeFieldLengthWarnings` bugün **karakter sınırı** kullanır ve bazen baseline değeri uyarıdan hariç tutar; kesin tipografik analiz değildir.
- `belge-studio-inline-edit-layer.tsx` içinde `initialValue` ile `currentValue` aynı değişken kaynağından aktarılıyor; mevcut çakışma koruması yetersiz. `belge-studio-pdf-preview.tsx` üst touch olayı popup'a yayılabilir; pinch sonrası yanlış kısa tap ve stale alan riski mevcut.
- Mevcut `tests/site-audit/belgeler-inline-edit.spec.ts` dosyasında gerçek React olmayan bir HTML/JS test harness'i bulunuyor; bunun başarısı gerçek popup davranışını ispatlamaz.

**Yerelde yeniden doğrulanacak:** Git `HEAD` ve kirli dosyalar; beş PDF'nin gerçek multiline flag ve widget görünümü; iOS/Android gerçek cihaz davranışı; gerçek PDF font boyutu/görünümün PDF okuyucularında eşdeğerliği; referans testlerin yereldeki durumu. Eski test raporu **bu planın testlerinin çalıştırıldığı anlamına gelmez**.

**Model doğrulaması:** Kullanıcının seçtiği `Gemini 3.8 Flash (High)` değişmez. Google'ın 2026 model sayfası API kimliğini `gemini-3.8-flash`, desteklenen düşünme düzeylerini `low/medium/high` olarak veriyor (https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ve https://ai.google.dev/gemini-api/docs/thinking). Kullanıcının IDE'sindeki görünür etiket ile API kimliği aynı olmak zorunda değildir; **ekranın mevcut modelini izinsiz değiştirme**. Aşamalar küçük, tek amaçlı ve test kapılı: High bile sıfır hata garantisi değildir.

---

## 3. Kesin çözüm mimarisi

### 3.1. Dört ayrı sorumluluk

**A. Form kaynağı** — Beş stüdyodaki `formData` ve mevcut `handleFieldChange` en üst otorite; başka store, PDF içine ikinci bağımsız state, duplicate imza mantığı yok. Popup'taki `draft` yalnız geçici, `Uygula` tek ve korumalı commit yapar.

**B. Etkileşim denetleyicisi** — PDF anotasyonundan `fieldKey/page/rect` alan mevcut harita değiştirilmez; yalnız görünen alanın *hangi render'a ait olduğunu* ve touch olaylarının kaynağını güvenli biçimde sınırlar. Re-render ve yakınlaştırma motoruna dokunmaz; **hazır olmayan overlay tıklanamaz**.

**C. Saf alan rehberi** — `validateBelgeField(documentId, fieldKey, rawValue, interactionContext?)` hiçbir girdiyi değiştirmez. Kesin format kuralı bilinenler için uyarı; hukuki/idarî formatı belirsizler için **yeni hata üretmez**. `checkAllFields` 56/56 anahtarı kapsar; eksik alan için açık test hatası verir. Aynı evaluator sol form ve sağ popup tarafından kullanılır; gösterim stratejisi farklı olabilir.

**D. Basım okunabilirliği** — Üretilmiş gerçek PDF örneklerinde **offline kanıt**. UI'da küçük bir **eşik/kanıt sınıflandırması**; font/satır sığması güvenilir ölçülmüyorsa “kesin okunur/okunmaz” yazılmaz. Yeni PDF üretimi, otomatik PDF düzenleme, her tuşta ikinci `PDFDocument.load()` yok.

### 3.2. Veri akışı (geri alma ve bağlı alanlar korunur)

```text
Sol form onChange ── mevcut handleFieldChange ──► formData (tek gerçek veri)
                                                      │
                ┌─────────────────────────────────────┘
                ├──► var olan PDF generator → snapshot → PDF.js canvas
                └──► saf rehber → sadece UI uyarısı

PDF hotspot → izole, kararlı draft oturumu {documentId,fieldKey,openingValue,...}
  → Uygula → güncel alanı son kez karşılaştır → mevcut form güncelleme kanalı
  → tek kabul/tek commit → aynı PDF ve aynı rehber akışı
  → çakışmada formData değişmez; kullanıcıya taslağı koruyan seçenekler
```

**Commit koruması (tasarım kontratı):** Popup açılırken alınan `openingValue` **immutable** olur; `currentValue` daima üst `formData`dan gelir. Onay **idempotent** olmalı (`inFlightRef`/benzeri). “Değer aynı mı?” karşılaştırması yalnız bir render'ın prop'u ile sınırlı kalmamalı: stüdyonun veri güncelleme sınırında beklenen değeri kontrol eden **saf ve yan etkisiz** state updater/reducer yaklaşımı kullanılmalı; reddedilen commit için hata UI'sı ayrı ilerleyen event/effect sonucu ile gösterilmeli. `setState` updater içinde `setError`, `onCommit`, toast veya başka yan etki üretme. Beş stüdyodaki bağlı imza mantığını kopyalama; doğrulanmış mevcut güncelleme fonksiyonuna *en küçük koruyucu adaptör* ekle. Eğer güvenli atomik sonuç üretilemiyorsa “son prop eşit” diye başarı ilan etme, ENGELLİ dur.

**İzole popup oturumu:** Popup taslağı, her `snapshot` yenilenmesinde unmount edilen hotspot JSX düğümünün içinde tutulmamalı. Gerekirse viewer'ın **kararlı üst düzeyi** (ör. önizleme paneli sibling/portal) oturumu taşır; OFF modda yaratılmaz. Yanlış dokunma/ara render/alakasız alan güncellemesi taslağı silmez. **Kasıtlı** Escape/Vazgeç/özellik kapatma ayrımı korunur; kirli taslağı sessiz yok edecek yeni davranış ekleme. Mobil klavye/scroll gerekirse popup'ı `touch-action:none` kapsayıcısının dışındaki kararlı portalda tutmak **yalnız test kanıtıyla** seçilecek; ilk tercih en küçük olay-sınırı düzeltmesi.

**Snapshot/koordinat geçerliliği:** Hotspot listesi *anahtarlı veri*dir `{snapshotRevision,pageNumber,renderRequestId,viewportWidth,viewportHeight,zoom,pdfFields}`. Overlay ancak `localStatus=ready`, `generationPending=false`, `generationError=null`, mevcut revision/page/ölçek boyutlarıyla **birebir eşleştiğinde** aktif olur. Render başlarken veriler eskiyse **tıklama disabled**. `canvas.style.transform === 'none'` **tek başına geçerlilik kanıtı değildir**. Geçersiz durumda PDF canvas yine görülebilir; eski katmana tıklanamaz. Render başına annotation okumaları sadece ON modunda, sona eren task/ref ile eşleştirilir. Yeni PDF.js document instance/lifecycle yaratma.

**Girdi kuralları ve uyarı semantiği:** `empty`, `pristine/default`, `editing-incomplete`, `warning`, `print-risk`, `no-guidance` birbirine karıştırılmaz. **`valid` → resmen doğru belge** gibi bir sonuç üretme. Tek bir alanda biçim + okunabilirlik uyarısı varsa kullanıcı için **en anlamlı tek mesaj** (veya açıkça ayrı iki kısa neden), eski genel uzunluk bildirimiyle yinelenmez. PDF-only sabit metinler ve `FreeText` için düzenleme hotspot'u yok.

### 3.3. Uzun adres için bilinçli ürün kararı

- İstifa `adres_deger` alanı PDF şablonunda yaklaşık **192×18pt**; örnekte olduğu gibi uzun metin küçülüyor. Bunu tek satırda geniş, okunur fontla **garanti etmek mümkün değil**. PDF şablonunu genişletme / yeni sayfa / otomatik metin kesme YOK.
- Kullanıcının **tam metni** hem solda hem popup'ta editör içinde rahatça görmesi sağlanır; uzun tek sözcük yatay taşmadan görünür ve klavyeyle düzenlenebilir. Tam metni kopyalama/inceleme mevcut native input davranışlarıyla korunur. Gerekirse yalnız editör UI yüzeyi genişler; PDF çıktı satır sayısı değiştirilmez.
- *Sadece gerçekten risk varsa*: “Bu alan PDF'de tek satır basılır; metin küçük kalabilir. Tam metin korunuyor. Önizlemeyi/indirilen A4 çıktısını inceleyin; isterseniz adresi kendiniz kısaltın.” `Mahallesi → Mah.` gibi örnekler **öneri olarak görünür ama otomatik uygulanmaz**; resmî adresi bozabilecek kısaltmalar **otomatik seçenek yapılmaz**.
- Tek satırlı bir PDF alanı metadata'da `textarea` olsa da popup editöründe satır sonu girilmesine izin veriliyorsa **PDF'nin satır sonunu boşluğa çevirdiği belirtilir**; mümkünse popup bileşeni gerçek PDF multiline bayrağına göre tek satırlı davranır. Sol formun mevcut girdi türünü sırf bu sebeple değiştirmek zorunlu değil.
- `PDF İndir` ve `Yazdır` engellenmez. Etiket “kesin güvenli baskı” anlamına gelmez. Gerçek çıktı okunamayacak düzeye inmiş olsa bile tam veri kaybolmaz; **kullanıcının kendisinin değiştirmesi** istenir.

---

## 4. 56/56 alan politikası — zorunlu envanter, seçici müdahale

**Kod anahtarı:** `F` = takvim tarihi, `K` = T.C. kontrol basamağı, `T` = telefon, `Y` = mevcut yumuşak YİBF, `P` = para, `R` = sadece kanıta dayalı PDF okunabilirliği, `M` = gerçekten multiline PDF'de satır/taşma riski, `N` = serbest resmî/teknik metin (kısıtlayıcı regex YOK), `S` = mevcut bağlı imza davranışı, `-` = düzgünse hiçbir yeni uyarı. **Her alanda `R` ölçümü geçerli olmak zorunda değil; yalnız gözlenebilir risk varsa mesaj göster.**

### 4.1. Beton Döküm Tutanağı — 10

| Alan | Politika | Değiştirmeme / istisna |
|---|---|---|
| `tutanak_alt_baslik` | N,R | Serbest başlık; otomatik büyük harf/kısaltma yok. |
| `tarih` | F | `GG.AA.YYYY`; boş/kısmi bilgi kaybı yaratmaz. |
| `yer` | N,R | Tam şantiye konumu ve ada-parsel ifadesi korunur. |
| `yibf` | Y | Mevcut YİBF alan uyarılarıyla uyumlu, sert sayı filtresi yok. |
| `olay_aciklamasi` | N,M,R | Teknik olay beyanını yeniden yazma. |
| `gozlem_notlar` | N,M,R | Notlar ve yazım biçimi kullanıcıya ait. |
| `laboratuvar` | N,R | Tam laboratuvar şirket adı serbest. |
| `muteahhit` | N,R | Tüzel kişilik ve ticaret unvanı korunur. |
| `santiye_sefi` | N,R | Ad/unvan birlikte serbest. |
| `yapi_denetim` | N,R | Tam denetim kuruluşu ismi serbest. |

### 4.2. İnşaat Ruhsatı Dilekçesi — 8

| Alan | Politika | Değiştirmeme / istisna |
|---|---|---|
| `tarih` | F | Tarih seçici zorunlu değil. |
| `belediye_adi` | N,R | Yerel idare ve resmî ekler serbest. |
| `mudurluk_adi` | N,R | Müdürlük adını otomatik tamamlama yok. |
| `ana_metin` | N,M,R | Resmî beyanı özetleme/kırpma yok. |
| `ad_soyad` | N,R | Türkçe çok kelimeli adlar ve unvan biçimleri serbest. |
| `unvan` | N,R | `Yapı Sahibi` örneğini koru; meslek sözlüğü zorunlu değil. |
| `adres` | N,M,R | `Adres:` öneki/satır sonu aynen saklanır; gerçek PDF multiline ayrı. |
| `tel` | T | `Tel:` önekini doğrulama kopyasında tanı, asıl metni değiştirme. |

### 4.3. Şantiye Şefi İstifa Dilekçesi — 10

| Alan | Politika | Değiştirmeme / istisna |
|---|---|---|
| `hitap_1` | N,R | İdare adı/hitap serbest. |
| `hitap_2` | N,R | İl/ilçe/birim etiketi serbest. |
| `ana_paragraf` | N,M,R | İstifa gerekçesini hukuken yeniden yazma. |
| `sonuc_cumlesi` | N,R | İsteğe bağlı serbest talep cümlesi. |
| `tarih` | F | Geçerli takvim tarihi; geçmiş/gelecek yasak değil. |
| `unvan` | N,R | İmza üstü mesleki unvan serbest. |
| `ad_soyad` | N,R | Tam kişi adı serbest. |
| `tc_deger` | K | 11 rakam, ilk rakam 0 olamaz, 10. ve 11. kontrol basamağı. **Kimlik doğrulandı deme.** |
| `iletisim_deger` | T | Yerel/`+90` seçenekleri; aşırı sıkı operatör kodu zorlaması yok. |
| `adres_deger` | **N,R (kritik)** | **PDF tek satır ve dar.** Tam metin kalır; okunabilirlik uyarısı ve kullanıcı kontrollü düzenleme. |

*Düzenlenemez üç etiket:* `adres_etiket`, `tc_etiket`, `iletisim_etiket` — **kural/hotspot olarak eklenmez**.

### 4.4. Şantiye Şefi Hizmet Sözleşmesi — 14, iki sayfa

| Alan | Politika | Değiştirmeme / istisna |
|---|---|---|
| `muteahhit_unvan` | N,R,S | Kaynakla eşleşen imza unvanı yalnız mevcut kuralda güncellenir. |
| `santiye_sefi_ad` | N,R,S | Özelleştirilmiş imza adı korunur. |
| `il` | N,R | Türkçe il adı, kırpma yok. |
| `ilce` | N,R | Serbest ilçe adı; gerçek çıktı dar olabilir. |
| `adres` | **N,R (kritik)** | PDF tek satır; `-` mevcut örnek nötr değer, uzun metin uyarısı. |
| `yibf` | Y | Boş/`-` korunur; 7 hane mevcut yumuşak rehber. |
| `pafta` | N,R | `-`, alfanümerik ve yerel biçimlere esnek; yalnız rakam şartı yok. |
| `mahalle` | N,R | 8 karakter gibi **yanıltıcı sert sınır yok**. |
| `ada` | N,R | Boş, `-`, karma not olasılığını kesme. |
| `parsel` | N,R | Boş, `-`, karma ifade olasılığını kesme. |
| `ucret` | P,R | Türkçe para değeri, örnek `40.000,00 TL`; otomatik yeniden format yok. |
| `sozlesme_tarihi` | F | **İkinci sayfadaki** tarih alanı korunur. |
| `santiye_sefi_imza_adi` | N,R,S | Elle değiştirilmiş imzayı kaynak ad ezmemeli. |
| `muteahhit_imza_unvan` | N,R,S | Elle değiştirilmiş müteahhit imzası korunur. |

### 4.5. Şantiye Şefi Taahhütnamesi — 14

| Alan | Politika | Değiştirmeme / istisna |
|---|---|---|
| `santiye_sefi_ad_soyad` | N,R | Türkçe adlar, birleşik soyadlar serbest. |
| `unvan` | N,R,S | Mevcut `unvan_imza` eşleşme koşulu korunur. |
| `oda_sicil_no` | N,R | Evrensel hane sayısı uydurma; yalnız anlaşılır öneri. |
| `tc_kimlik_no` | K | İstifa ile aynı algoritma; kimlik gerçekliği denetlenmez. |
| `telefon` | T | Örnek telefon dâhil uygun 10/11 hane ve `+90` değerlendirmesi. |
| `adres` | N,R | Dar satırda basım riski, metin korunur. |
| `il_ilce` | N,R | `/`, mahalle/yerel isimler serbest. |
| `ilgili_idare` | N,R | İdare adı serbest. |
| `pafta_ada_parsel` | N,R | `Pafta: 12, Ada: 345, Parsel: 6` metnini koru. |
| `yapi_adresi` | **N,R (yüksek risk)** | Dar uzun teknik adresi sessizce kırpma. |
| `yapi_sahibi` | N,R | Kişi veya şirket adı olabilir. |
| `yapi_sahibi_adresi` | **N,R (yüksek risk)** | Tam adres kullanıcıya görünür, baskı riskini bildir. |
| `tarih` | F | Gerçek takvim günü, boş değer zorunlu değil. |
| `unvan_imza` | N,R,S | Elle özelleştirme korunur. |

**Alan bazlı uyarı gösterim politikasının özeti:** `N` türündeki alanlarda **yalnızca “normal görünen alan” diye uyarı üretme**. `F/K/T/Y/P` yalnız biçimsel şüphe varsa; `R/M` yalnız ölçüm/kanıt veya kesin sınır durumunda. Mevcut `BelgeFieldLengthWarnings` ile çakışanları tekilleştir. Varsa kayıtlı orijinal varsayılan hatalı veya kalitesiz görünüyorsa “varsayılan olduğu için tamamen sorunsuz” sayma; yalnız gereksiz alarmı bastır.

---

## 5. Değer doğrulama sözleşmesi (saf, geri uyumlu, insan dostu)

- **T.C.** `11` *ASCII* rakam, ilk rakam 0 olamaz. `d10 = (7*(d1+d3+d5+d7+d9) - (d2+d4+d6+d8)) mod 10`, sonuç negatifse pozitif modulo; `d11 = sum(d1..d10) mod 10`. Geçen örnek `11111111110`; yanlış `12345678901`, sıfır başlayan `00000000000`, `12`, boş, boşluk/harfli değer ayrı sınıflanır. “Kontrol basamakları tutarlı” der; “resmî olarak geçerli kişi” demez. **Rakamları sahte test örneklerinde bile kullanım dışına/loglara taşırma.**
- **Tarih** `GG.AA.YYYY`, `new Date('01.02...')` ile locale-dependent parse YOK. Elle parse edip ayın gerçek gün sayısını ve artık yıl kuralını kontrol et. `29.02.2024` olur; `29.02.2025`, `31.04.2026`, `00.01.2026` uyarır; `01.05.2026` örnek; boş/yarım ayrı, geçmiş tarih kendiliğinden hata değil.
- **Telefon** yalnız doğrulama kopyasında `Tel:` önekini ve görsel boşluk/`+90` varyantlarını ayıkla. Uzunluğu 10 haneli ulusal numara / başında 0 ile 11 / `+90` ile 12 rakam biçimlerini test et; sabit/cep operatörünü kesin doğrulama iddiası yapma. Mevcut örnek **`0566 666 66 66`** otomatik reddedilmesin/uyarıya boğulmasın; boş/kısmi mesajı baskıcı olmasın.
- **YİBF** bugünkü ekranda 7 hane uyarısı varsa onu **koru**, tutarsız yeni iki ayrı uyarı çıkarma. `1234567`, `-`, boş, `AB-123/45` gibi önceki kullanıcı değerleri kesilmeden kalır; biçim önerisi yumuşak. Bir kod üzerinden tüm belge kurallarını genelleyip eski özel yardım metnini bozma.
- **Ücret** `40.000,00 TL`, `40000`, `40000,00` benzeri yerel biçimler çok katı olmayan ayrıştırmayla ele alınabilir. Geçersiz virgül/çoklu ayraç/eksi değer için yardımcı açıklama; kuruş, para birimi, hukukî yükümlülük varsayımıyla sessiz düzeltme/otomatik hesap yok.
- **Tanımlayıcı / kişi / şirket / adres / teknik anlatım** evrensel hane/alfabe regex'i veya sabit resmi sözlük yok. Karakter sayısı tek başına “geçersiz” değil; form boşsa mecburi hata yok; `-` eski semantiğinde kalır. İçerikte kalıcı hukuki tutarlılık, kişinin sorumluluğudur; sistem “onaylı dilekçe” iddiası üretmez.
- `fieldGuidance` dönüşü **çok kısa**, ör. `{code, severity: 'info'|'warning'|'printRisk', message, kind:'format'|'print'}` veya `null`. `null` “resmen geçerli” demek değil. `rawValue` **aynen** kalır. Varsayılan/baseline, `touched`, `blur`, `hasAttemptedCommit` UI görünürlüğü değerlendirmesinde kullanılır; doğrulama fonksiyonunun kendisi örtük DOM state'e bağımlı olmaz.
- **Risk önceliği:** Veri kaybı riski veya gerçek baskı okunamazlığı > checksum/biçim rehberi > kozmetik bilgi. Aynı alanın eski uzunluk ve yeni baskı uyarısı iki ayrı tekrarlı panelde gösterilmez. Kullanıcı formu ilk açtığında 56 mesaj listesiyle karşılaşmaz.

---

## 6. Basılabilir PDF okunabilirliği — kanıt, sınırlama ve kabul yöntemi

1. Şablon üzerinden alanın `rect`, `isMultiline`, `DA`, mevcut hedef fontu ve gerçek doldurulmuş **appearance** çıktılarını testte envanterle. `pdf-lib`'in `getDefaultAppearance()` bilgisi **her okuyucunun bastığı font boyutuna denk olmayabilir**; bunu çıktı tarafında Poppler/PDF.js raster karşılaştırmasıyla doğrula. İmaj büyütmesi PDF fiziksel puntosu değildir. İki mekanizmadan sonuç çelişirse ölçüm **belirsiz**.
2. Yalnız güvenilir üretilmiş PDF'den okunuyorsa “PDF'de metin yaklaşık X puntoya küçülüyor” gibi sayısal ifade kullan; mümkün değilse `printRisk: possible/unknown`. Üretimde basitleştirilmiş hedeften kesin font çıktısı **uydurma**. Varsayılan hedef boyutu 6.8–7.8pt olan başka belgeyi keyfî “8 pt altı başarısız” diyerek yanlış uyarma.
3. Test matrisi: istifa `adres_deger` uzunlukları (varsayılan, 80, 140, 220 karakter, 220 karakterlik tek kelime), sözleşme `adres` ve `yibf`, taahhüt `adres/yapi_adresi/yapi_sahibi_adresi`, istifa gövde/sözleşme imzası, ruhsat `adres/ana_metin`, beton `yer/olay_aciklamasi`. Yalnız sentetik Türkçe veriler; çıktı **A4 fiziksel** ölçütüyle incelenir.
4. **Önce çıktı eşdeğerliği:** aynı sentetik girişe eski ve yeni kaynak üzerinden PDF üretildiğinde AcroForm değerleri, sayfa sayısı, nominal form geometrisi değişmemeli; görünüm/render karşılaştırmasıyla yeni helper'ın PDF üretimini değiştirmediği kanıtlanmalı. PDF byte'larını byte-for-byte eşit bekleme (metadata ve serializasyon farkı olabilir); **mantıksal değer/görünüm** kıyasla.
5. Riski sade anlat: `görsel kapasite yeterli / baskıda küçük olabilir / çok ciddi küçülme / ölçüm belirsiz` — son durum *asla* “kesin okunur” gibi sunulmaz. Karar için basım ölçümü elde edilemiyorsa dar tek satır için geometriden muhafazakâr bir **olasılık** uyarısı sun, daha fazlasını iddia etme.
6. Runtime'da her `onChange` için ikinci PDF parse, `pdf-lib` load, fontkit embed, font rasterize, ağa fetch, büyük canvas veya background worker açma. Hafif saf karakter/uzunluk/yerleşim ipucuyla **erken uyarı** + offline doğrulanmış gerçek PDF testleri yeterli. Mevcut PDF debounce/cancel/retry kodu değişmez.
7. **Şablon düzenlememe bedeli dürüstçe yazılır:** Uzun resmi adres aynı dar tek satırda tam uzunlukta ve normal puntoda **fiziksel olarak sığmaz**. Uyarının amacı gerçek riski görünür kılmaktır; kullanıcı daha kısa yazmazsa aynı küçük fontla indirilmeye devam edecektir. Herhangi bir modelin bunu “kesin çözdüm” diye sunması başarısızlık sayılır.

---

## 7. Aşama planı (her `devam` → yalnız bir aşama)

| Kimlik | Amaç | Kanıt türü |
|---|---|---|
| `ASAMA_01` | Yerel başlangıç ve kırmızı regresyon kanıtları | 56 alan envanteri, hash ve mevcut hata testi |
| `ASAMA_02` | Popup içi touch/gesture izolasyonu | Gerçek pointer/touch, pinch bitişi ve eski zoom PASS |
| `ASAMA_03` | Taslak çakışması ve tek commit | Gerçek React üzerinde aynı-alan yarış testi |
| `ASAMA_04` | Stale sayfa/snapshot ve odak/draft yaşam döngüsü | Revision/page/zoom eşleşme ve veri kaybı testi |
| `ASAMA_05` | 56 alanın saf ve esnek kalite kuralları | Saf/özellik bazlı test, negatif senaryolar |
| `ASAMA_06` | Fiziksel PDF okunabilirlik kanıtı | Gerçek PDF field/appearance/raster testleri |
| `ASAMA_06B` | PDF Adres Alanlarının Fiziksel ve Okunabilirlik İyileştirmesi | AcroForm geometri genişletme, çok satırlılık ve basım punto testi |
| `ASAMA_07` | Sol form + PDF popup'ında sade rehber UI | Beş stüdyo, uyarı tekilliği, erişilebilirlik |
| `ASAMA_08` | Gerçek tümleşik regresyon ve PDF doğruluğu | 56 sözleşme + risk bazlı UI + mobil a11y |
| `ASAMA_09` | Son yerel koruma ve release hazırlığı | Baseline karşılaştırma, build, test, kısa dokümantasyon |
| `ASAMA_10` | Tek Production yayın ve canlı kabul | Tek SHA, Vercel READY + canlı gerçek smoke |

### ASAMA_01 — Baseline, envanter ve **gerçek hatanın önce gösterilmesi**

**Giriş:** Kullanıcının yerel projesi ve bu plan mevcut. **Dosyalar:** mevcut kaynaklar/testler, `PROJECT.md`/kurallar, `PLAN/` içinde yeni plan+durum; üretim koduna henüz müdahale yok.

1. `git status --short`, `git rev-parse HEAD`, `git diff --name-only` ile mevcut çalışma ağacı; özellikle kullanıcı işi; paket sürümleri/test komutlarını kaydet. `14235bd...` yalnız kaynak referansıdır; **zorla checkout/reset/auto pull yok**.
2. PDF binary ve `DOCUMENT_EDITABLE_FIELDS` üzerinden **56/56** `fieldKey`, sayfa, rect, `isMultiline`, `DA/AP`, nominal görünüm, varsayılan değer; 3 PDF-only + 7 FreeText ayrı envanter. Var olan hash/manifestleri yeni HEAD'e göre kayıt altına al. Teknik şablon testlerini yalnız bu çalışma kapsamında üret, PII loglama yok.
3. Üretimi değiştirmeden gerçek uygulama üzerinde en az üç **önceden FAIL** beklenen durum: (a) mobil popup'ta gerçek dokunma → taslak unmount riski, (b) popup açıkken aynı alan sol formdan değiştirilir → eski taslağın yeni değeri ezmesi, (c) uzun adres → basım punto/görsel küçülmesi. Üçüncü test “uyarı henüz yok” şeklinde kırmızı olabilir; gerçek PDF'deki fiziksel küçülme ise mevcut davranışın kanıtıdır, **hata diye motoru değiştirme**. Mevcut durumda her test mutlaka deterministik FAIL vermiyorsa riskin gözlemlenemeyen kısmını açık işaretle; sahte FAIL yazma.
4. Önceki `PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md` değiştirmeden, bu dosyayı yerel `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_PLAN.md` olarak kopyala; `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_STATE.md` durum dosyasını oluştur. Eski tamamlanmış iş ayrı kalır.

**Kontrol:** `npx tsx tests/belgeler/document-field-contract.test.ts`, `npx tsx tests/belgeler/inline-edit-field-map.test.ts`, hedefli mevcut Playwright ve `git diff --check`. **Kabul:** gerçek worktree ve 56 alan/üç korumalı tür kayıtlı, kritik bug'lar test veya açıklanabilir teknik kanıtla sabit, motor kaynakları değişmedi. **Hata:** envanter/temel test yapılamazsa `ENGELLI`; korumalı şeyi düzeltmeye çalışıp kapsam büyütme. **DUR → ASAMA_02 bekle.**

### ASAMA_02 — Mobil popup ve yanlış kısa tap izolasyonu

**Giriş:** ASAMA_01 kanıtı var. **Dosyalar:** `src/components/belge-studio-inline-edit-layer.tsx`, `src/components/belge-studio-pdf-preview.tsx` yalnız olay sınırında; hedefli gerçek site Playwright.

1. Popup içindeki dokunma üst viewer'ın `onPointerDown` handler'ına iletilip `setIsInteracting(true)` → unmount üretiyor mu **gerçek touch** ile göster. İlk çözüm: editör/hotspot hedefleri için dar event boundary; popover içindeki pointer/touch viewer pan/capture'ı **tetiklemesin**, PDF boşluğunda eski pinch/pan **aynen** çalışsın. Parent handler'da hedef sınırı gerektiğinde kontrol et; React capture/bubble ve `touch-action:none` davranışını gerçek tarayıcıda test et. Motorun touch capture/zoom matematiğini yeniden yazma.
2. Popup içine yazı, textarea kaydırma, açılan mobil klavye, “Uygula/Vazgeç”, uzun basma, odak, Ctrl/Cmd+zoom kısayollarının input odağındayken eski viewer'a bulaşmaması testleri. Yalnız kanıt gerektiriyorsa popover'ı kararlı sibling/portal konumuna al; OFF modda onu hiç mount etme.
3. Pinch sonrası son parmağın bırakılması tek parmak tap sayılmasın: **jest oturumu `everMultitouch`** bayrağı tüm ilgili pointer'lar bitene kadar korunur. Normal tek tap çalışmaya devam eder; kaydırma/uzun basış hotspot açmaz.

**Kontrol:** gerçek `page.touchscreen.tap()` + CDP çok dokunma (kullanılan tarayıcı destekliyorsa) veya eşdeğer gerçek pointer event testi; `hasTouch` tek başına kanıt değil. PDF ON/OFF pan, pinch, toolbar zoom, mobile tab. **Kabul:** popup tap ile kapanmaz, touch ile alan kaydı/iptali çalışır; sahte kısa tap yok, OFF aynen. **Hata:** child/sınır değişikliğini izole geri al, eski engine patch yok, `ENGELLI`. **DUR → ASAMA_03.**

### ASAMA_03 — Gerçek veri çatışması ve idempotent onay

**Giriş:** ASAMA_02 PASS. **Dosyalar:** inline layer + beş stüdyoda zorunlu en küçük form-bağlantısı adaptasyonu; mevcut imza/undo mantığı korunur.

1. Popup açıldığında `{fieldKey, openingValue, draftValue}` sabitle; `currentValue` yalnız üst `formData`dan güncellensin. `initialValue` ve `currentValue` aynı yeni prop ifadesinden türetilmeyecek. Çatışmada kullanıcı yazdığı taslağı **görebilmeli**: “Sol formda bu alan değişti; yeni değeri ezmedik. Taslağı kopyalayabilir, güncel değeri yükleyebilir veya vazgeçebilirsiniz.” Sessiz zamanlayıcıyla kapanma yok.
2. `Uygula`da **tek commit**: çift tık, Enter+click, React StrictMode etkileşimi tekrar yazmasın. Son değeri canonical yazma sınırında beklenen `openingValue` ile kontrol et. **Saf updater içinde yan etki üretme**, kaydetme sonucunu ayrı göster. `handleFieldChange`deki bağlı imza kurallarını taklit etme; o koda yalnız gereken dar guard ekle. Değişen field key veya geçersiz documentId hiçbir zaman yazılmamalı.
3. Yeni conflict akışına yönelik gerçek React test: popup aç → sol formda **aynı alanı** değiştir → eski taslağı `Uygula` → sol form en son değerde, bağlı imza ve indirilen PDF bozulmadan, taslak hâlâ görülebilir. Aynı anda **başka alanı** değiştirme → taslak korunur. Doğrudan `page.setContent()` HTML kopyası kabul edilmez.

**Kontrol:** hedefli Playwright gerçek bileşen + TS/lint + mevcut linked imza testleri. **Kabul:** kaybolan taslak ve eski değerin güncel veriyi ezmesi yok; `onCommit` bir kez; imzalar mevcut kurala uygun. **Hata:** yeni bağlayıcıyı geri al, eski form motoru refactor etme; `ENGELLI`. **DUR → ASAMA_04.**

### ASAMA_04 — Revision/page/zoom geçişlerinde bozuk hotspot ve taslak yok

**Giriş:** ASAMA_03 PASS. **Dosyalar:** `belge-studio-pdf-preview.tsx` yalnız etkileşim katmanı koordinat yönetimi, gerekirse inline layer'ın kararlı state host'u; PDF engine/hook değişmez.

1. `renderPage` işinin başarılı tamamlanması ve annotation dönüşüyle eşlenmiş `{snapshot.revision,currentPage,renderRequestId,viewport/zoom}` token'ı oluştur; `generationPending`, `localStatus !== ready`, page değişimi, pinch, fit, `canvas.transform`, yeni revision veya error durumunda önceki overlay **hemen inert** olsun. `scale(1)` tek başına güvenli durum sayılmaz. Gereksiz ikinci render/task doğurma.
2. Sahte ve yanlış sayfa alanını kesin engelle: sözleşmede sayfa 1 (11 alan) → sayfa 2 (3 alan) → tekrar 1, hızlı form değişimi, 3 zoom, 2 on/off çevrimi. Üretilen eski annotation sonra dönse bile yeni render'a uygulanmasın.
3. Popup oturumu değişmeyen gerçek alan/sayfa için alakasız form data revizyonunda **silinmesin**; sayfa değişikliği/özellik kapatma/gerçek widget kaybolmasında kullanıcıya anlaşılır iptal veya taslağı koruma akışı uygula. Gereksiz DOM re-mount, React effect döngüsü, odak kaybı ve memory leak olmasın. Dışarı tıklamayla mevcut kasıtlı iptal semantiği korunur; yeniden render bu kasıtlı iptal sayılmaz.
4. `aria-modal="true"` kullanılıyorsa gerçek modal davranışı (odak hapsi/arka plan inertliği) uygulanmalı; bu mimaride değilse `role="dialog"` ile semantik tutarlı hâle getir, `Escape`, Tab, odak geri yükleme ve mobil klavye testleri.

**Kontrol:** gerçek Playwright, yavaş CPU/revision yarış koşulları, gizli/aktif overlay hit-test, iki sayfalı sözleşme. **Kabul:** yanlış sayfa/yanlış revizyon hotspot'u yok, ara render taslağı silmiyor, mevcut preview/zoom değişmedi. **Hata:** bağımsız ek katmanı kapatacak fail-closed geri dönüş, `ENGELLI`. **DUR → ASAMA_05.**

### ASAMA_05 — 56 alanın saf ve seçici doğrulama kuralları

**Giriş:** ASAMA_04 PASS. **Yeni dosyalar:** öneri `src/lib/belgeler-field-guidance.ts`, `tests/belgeler/field-guidance.test.ts`. `document-field-contracts.ts` READ-ONLY.

1. Bölüm 4'teki 56 `fieldKey` için `satisfies Record<BelgeDocumentId,...>` veya denk tip güvenli registry; ancak yalnız `F/K/T/Y/P` türlerinde semantik validasyon. Diğerlerinde **yalnız baskı riski ölçülmüşse** uyarı. `no-guidance` için mesaj üretme. Eski `-` ve orijinal default/kısmi değerleri açık test et; kontrat harici key hata döndürsün.
2. T.C. checksum (ilk rakam, 11 hane, d10/d11), tarih leap-year, `Tel:` ve `+90`, YİBF, TL formatları **saf, yan etkisiz, gizliliğe saygılı** test edilir. Türkçe karakter/Unicode, uzun tek kelime, boş ve kısmi giriş için yanlış pozitif listesi. Sıfır kullanıcı değerini dönüştürme.
3. Uyarı sisteminin UI entegrasyonu bu aşamada yapılmaz; **saf fonksiyon testinden** geçer. `validate` sonucu `null` “resmî geçerli” sayılmaz. Veri modeli kontrollü (ham TCKN/telefon veya tam form değerini log alanlarında taşıma yok).

**Kontrol:** `npx tsx tests/belgeler/field-guidance.test.ts`, mevcut document-field-contract, TS/lint. **Kabul:** 56/56 anahtar eşlenir, kritik sentetik negatif/pozitif testler, değer mutasyonu sıfır, bilgilendirici. **Hata:** yeni modül geri alınabilir, `ENGELLI`. **DUR → ASAMA_06.**

### ASAMA_06 — Gerçek PDF basım okunabilirliği ve uzun adres için dürüst çözüm

**Giriş:** ASAMA_05 PASS. **Yeni dosyalar:** gerekirse `src/lib/belgeler-pdf-readability.ts`, `tests/belgeler/pdf-readability.test.ts`; mevcut `pdf-engine.ts` READ-ONLY.

1. Aynı sentetik örnekleri **gerçek mevcut üretim fonksiyonuyla** PDF'ye dök; alanın kaynak değeri, `DA`, appearance, widget geometrisi, tam/kısmi satır yapısı ve **A4 render görünümü** analiz edilir. Orijinal/80/140/220 karakter/uzun tek kelime istifa adresi, ardından dar sözleşme ve taahhüt adresleri, seçilmiş diğer metin alanları. Poppler varsa kullan, yoksa mevcut PDF.js fixture renderer; tool yokken varmış gibi davranma.
2. `DA` veya görünümden gerçek çıktı fontunu güvenilir elde edebiliyorsan düşük maliyetli offline kalibrasyonla `none/possible/serious/unknown` riskini belirle; okuyucuya göre fark varsa **unknown**. Keyfî 8 pt mutlak sınırı yok, değer `default` diye kesin güvenli kabul edilmez. “%100 zoom = baskı punti” yanlışını kod ve UI'dan uzak tut.
3. Runtime tarafında **yalnız saf/ucuz öngörü** ve tek satır açıklaması; her harfte yeniden PDF parse/print render yok. `BelgeFieldLengthWarnings`un geçmiş karakter üst sınırlarının gerçek baskıyı doğrulamadığını kanıta bağla, gerektiğinde tekilleştirme için daha sonra kullanılacak küçük rehber veri sözleşmesini çıkar.
4. Orijinal `pdf-engine` ve şablon hiç değişmeden **PDF alan değeri eksiksiz** saklanıyor mu ve font/appearance davranışı referans sürümle aynı mı karşılaştır. **Baskı okunurluğu yine yetersiz** olsa bile bunu gizleme. Kullanıcıya yalnız kendi değiştirebileceği kısaltma rehberi; otomatik kırpma/ek sayfa yok.

**Kontrol:** gerçek PDF binary/AcroForm ve raster testleri; orijinal/maksimum stres; kişisel veri sızıntısı yok. **Kabul:** resimdeki uzun adres **riski görünür kılacak doğrulanabilir kural**, tam PDF değeri korunur; saklanan değer ve basım görünümü “iyileşmiş” diye uydurulmaz. **Hata:** kesin ölçülemeyen statüyü `unknown/possible` yap, yanlış-pozitif alarm üretme; hâlâ anlamsızsa özelliği ekleme, `ENGELLI`. **DUR → ASAMA_06B.**

### ASAMA_06B — PDF Adres Alanlarının Fiziksel ve Okunabilirlik İyileştirmesi (Kontrollü Şablon İstisnası)

**Giriş:** ASAMA_06 PASS.
**Kapsam ve Yetki Sınırı:** Kullanıcı talimatı gereği `public/belgeler/*.pdf` dosyalarına dokunmama kuralına **yalnızca bu adres geometrisi iyileştirmesi için kontrollü istisna** tanınmıştır. Başka şablonlar, motorlar veya belge metinleri yeniden düzenlenemez.
**Öncelikli Alan:** İstifa dilekçesi `adres_deger` (mevcut PDF alanı ~192 × 18 pt).
**İncelenecek Diğer Alanlar:**
- İnşaat Ruhsatı Dilekçesi: `adres`
- Şantiye Şefi Hizmet Sözleşmesi: `adres`
- Şantiye Şefi Taahhütnamesi: `adres`, `yapi_adresi`, `yapi_sahibi_adresi`
- Beton Döküm Tutanağı: `yer`
*Kural:* Yeterince geniş ve düzgün çalışan alanlara dokunulmaz. Tüm belgelere aynı kutu boyutu veya aynı satır sayısı uygulanmaz.

**İcra Adımları:**
1. Beş belgenin orijinal PDF alan geometrisini incele (`rect`, `Ff`, `DA`, `AP`).
2. İstifa adresindeki okunamayan uzun metni gerçek PDF çıktısında yeniden üret.
3. Mevcut alanın çevresindeki boşlukları ve diğer nesneleri ölç.
4. Güvenli genişleme bölgesini belirle (diğer PDF içerikleriyle çakışma oluşturmadan, orijinal A4 düzenini koruyarak).
5. PDF alanını kontrollü olarak genişlet ve gerekiyorsa çok satırlılık (`Ff: multiline`) desteğini uygula.
6. İyileştirmeyi 60, 120 ve 220 karakterlik yapay adreslerle dene.
7. Yazı punto boyutlarını, tam metin korumasını ve gerçek baskı görünümünü karşılaştır.
8. Diğer adres alanlarında yalnız gerekli iyileştirmeleri uygula.
9. Tüm eski ve yeni PDF çıktılarının görüntü, alan değerleri ve yerleşim regresyonlarını çalıştır.
10. Değişen şablonların yeni SHA-256 hash'lerini kaydet (eski hash'leri silmeden). Hotspot'lar yeni PDF widget koordinatlarından dinamik hesaplanmalıdır; sabit CSS pikseli kullanılmaz.

**Kontrol:** Gerçek PDF parser/inspect, raster karşılaştırması, 56 sözleşme testi, Playwright gerçek PDF render.
**Kabul:** İstifa adresinde ölçülebilir okunabilirlik iyileşmesi, tam veri koruması, çakışmasız A4 düzeni.
**Hata:** Şablonun güvenli biçimde genişletilemediği kanıtlanırsa mevcut çalışan sürümü koru, aşamayı `ENGELLI` işaretle. **DUR → ASAMA_07.**

### ASAMA_07 — Sol form ve sağ popup için tutarlı, az uyarılı arayüz

**Giriş:** ASAMA_06 PASS. **Dosyalar:** beş `*-studio.tsx` içine en küçük entegrasyon, `belge-studio-inline-edit-layer.tsx`, gerekirse yeni `belge-field-guidance.tsx`; eski `BelgeFieldLengthWarnings` geriye uyumlu.

1. Sol form alanının **hemen altında** ilgili `touched/blur` ve yüksek risk mesajı; sağ popup'ta **aynı saf evaluator**, ama popup draft'ına göre (formData'ya onay öncesi dokunmadan). Girdi sırasında ısrarlı canlı anons yok; `aria-describedby` doğru ID, görünür tek anlamlı mesaj. Mevcut YİBF uyarısıyla, `BelgeFieldLengthWarnings` ile **çifte uyarı yok**.
2. TCKN “11 haneli olmalı” için erken ama saldırgan olmayan kısmi yardım; kontrol basamağı uyarısı onay/blur sonrası. Telefon önekleri bozulmaz. Tarih/ücret yalnız gerçekten belirgin hatada uyarır. Kurum/kişi/pafta gibi serbest alanlarda yeni kısıtlayıcı regex yok.
3. Uzun adres tam değeri sol editörde okunur olmalı, dar PDF'deki tek satır kısıtı açıkça anlatılır. Dokunulmamış 56 alan yanında gereksiz durum rozeti/bilgi ikonları yok; yalnız gerçek riskte görünür. Çok uzun kelime/popup dar alanı, 320px mobil soft keyboard, ekran döndürme, dark/light, odak/yatay taşma kontrolü.
4. `PDF İndir`, `Yazdır`, `Temizle`, `Geri al`, `Sıfırla`, örnek veri, bağlı imzalar ve tek gerçek veri akışı hiçbir uyarı yüzünden devre dışı kalmaz. OFF mod viewer üzerinde ilave overlay/annotasyon fetch yok.

**Kontrol:** her şablondan az birer gerçek alan, uzun adres + TC + telefon + tarih + YİBF + ücret; Playwright ve axe; eski PDF çıktı. **Kabul:** kopyasız, erişilebilir rehber; hiçbir veri otomatik değişmiyor; eski form davranışı yerinde. **Hata:** yalnız yeni uyarı UI'nı geri al; `ENGELLI`. **DUR → ASAMA_08.**

### ASAMA_08 — Kanıt gücü yüksek regresyon testleri (maket yerine gerçek)

**Giriş:** ASAMA_07 PASS. **Dosyalar:** `tests/belgeler/` ve `tests/site-audit/` ilgili testler; özel yeni altyapı yok.

1. **Sözleşme ve PDF çıktı düzeyi:** 56/56 izin verilen alan; üretilmiş her PDF alanı correct key/value; 3 PDF-only değişmez ve 7 FreeText hotspot olmaz. Beş gerçek PDF rotasında az ama anlamlı UI path; tüm 56'yı tek tek Playwright penceresiyle açıp 56 indirme ile zaman kaybetme. Yine de DOM hotspot sayıları/sayfa ilişkileri 56/56 envanterle eşleşir; örneklemede dar/uzun/çok satır/numara/bağlı imza/yüksek risk çeşitliliği zorunlu.
2. **Gerçek React kritik senaryoları:** mobil popup `tap → type → cancel/apply`, açıkken sol form aynı alanı değiştirme/çakışma, alakasız alan değişimiyle draft sürekliliği, double click, Türkçe IME, focus/Tab/Escape, sayfa/zoom/pinch/fit sırasında stale hotspot, 2 sayfa arasında gidip dönme. Maket testi sadece saf geometri yardımcı kanıtıdır.
3. **Eski işlev korunması:** 5 belge soldan edit → PDF alan içeriği; clear/reset/undo; bağlı imza default eşleşmesi ve kullanıcı özelleştirmesi; PDF indir/boş form/yazdır; PDF hatada retry; tema ve mobil tab. Test edilenler ile yalnız görünürlüğü kontrol edilenler raporda farklı belirtilir.
4. **Güvenlik ve UX:** personel/telefon/TC URL/console/telemetri yok; 320×720, 390×844, 768×1024, 1366×768, 1920×1080 ve 844×390; klavye/dokunmatik, dark/light, axe serious/critical. WebKit erişimi varsa çalıştır; sadece Chromium test edildiyse iOS Safari garantisi iddia etme.
5. **Negatif veriler:** boş, `-`, örnek tarih ve TC, yanlış checksum, leap-year, 220 karakter adres, tek aşırı uzun kelime, Türkçe şirket adı, ücreti ayraçlı değer, `Tel:`; alan veri kaybı/otomatik truncation **0**.

**Komut (varlığı yerelde teyit edilerek):** `npx tsx tests/belgeler/field-guidance.test.ts`, `npx tsx tests/belgeler/pdf-readability.test.ts`, `npx tsx tests/belgeler/inline-edit-field-map.test.ts`, `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-inline-edit.spec.ts --project=chromium-desktop-1920 --project=chromium-mobile-390`, `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-functional-audit.spec.ts --project=chromium-desktop-1920`, mevcut mobil stüdyo testi. **Kabul:** kritik gerçek kullanıcı akışları geçer, PDF saklanan değerleri eşdeğer; başarısız test `SKIP` edilip PASS sayılmaz. **Hata:** tek sorun alanı değişikliği, gerçek test tekrar; `ENGELLI`. **DUR → ASAMA_09.**

### ASAMA_09 — Final güvenlik, performans, sürüm ve dokümantasyon kapısı

**Giriş:** ASAMA_08 PASS. **Dosyalar:** sınırlı kaynak diff'i, durum dosyası, `docs/BELGELER_SISTEMI.md` içine küçük yeni ek.

1. `git diff --name-status`, başlangıç manifest/sha256 ve korumalı blob SHA: `pdf-engine`, `use-belge-studio-document`, 5 template binary, `document-field-contracts`, CAD/Dokümantasyon, pdfjs loader ve zoom math **değişmemiş**. Kullanıcının plandan önceki kirli dosyalarına ilişme. Kasıtsız CSS/global/tema değişikliği yok.
2. Tekrarlı 15 alan düzenleme + 15 feature toggle + hızlı pinch/fit + snapshot yarışında stale listener, object URL, render task ve bellek davranışını baseline ile **aynı ortamda** karşılaştır. OFF overlay DOM 0, annotation fetch ek yük 0; görünürlük/başlangıç zamanı belirgin kötüleşmemeli. Keyfî “60 FPS garantisi” kurma.
3. `npx tsc -p tsconfig.next.json --noEmit --incremental false`, değişen TS/TSX `eslint`, `git diff --check`, var olan PDF generation-longtext-contract testleri, `npm run build` ve ilgili site kalite kapıları. İşlev testlerinin geçmesi build'in yerini tutmaz; build'in geçmesi gerçek PDF'nin yerini tutmaz.
4. Yaşayan `docs/BELGELER_SISTEMI.md` içine kısa işletim kararı: saf alan rehberi, gerçek PDF tek satır sınırı, test/rollback, varsayılan OFF; önceki `PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md` işaretini değiştirme. Kanıtların hangi commit/dirty tree'de elde edildiği yeni durum dosyasında saklı olsun.

**Kabul:** baseline korunmuş, uzun adres halen **tam** PDF metni, ölçüm dürüst, değişiklikler odaklı, regresyon ve build PASS. **Hata:** kaynağı korumayan diff/performans gerilemesi varsa izolasyon ve `ENGELLI`; ASAMA_10 yok. **DUR → ASAMA_10.**

### ASAMA_10 — Tek kontrollü Production yayımlama ve canlı doğrulama

**Giriş:** ASAMA_09 PASS, test edilen final worktree ile yayımlanacak değişiklik aynı; `main`, izinler ve proje kuralları doğrulandı. **Kapsam:** bu göreve ait tamamlanmış kaynak/test/doküman ve gerekli durum kaydı; başka proje dosyası yok.

1. Repo `AGENTS.md` yerel IDE politikasına göre **tek anlamlı atomik checkpoint**: önce `main` üzerindeki kullanıcı değişikliklerini koru, **bir defa** uygun commit/push, force yok. Ara commit/deploy/test amaçlı remote branch spam yok. `main` Vercel Production tetikler; bunu “önle” talimatı koyma.
2. Vercel deployment durumu `READY`, **commit SHA** ve `muhendislik-site.vercel.app` alias'ın **aynı test edilen sürümü** gösterdiği doğrulanır. Status tek başına kabul değildir.
3. Canlı 5 stüdyo OFF/ON, en az bir gerçek popup/iptal/uygula, uzun adres risk mesajı, TC uyarısı, sözleşme sayfa değişimi/zoom/fit, bir sentetik PDF indir ve alan içerik karşılaştırması, mümkünse mobil touch smoke. Hiçbir gerçek kişisel veri girilmez; testin erişmediği donanım/Browser açıkça belirtilir.
4. Yayında sorun görülürse art arda kod pushlamak yerine **önceki doğrulanmış Production** sürümüne kontrollü rollback. Bu görevin dışı servislere dokunma. Çalışan kanıt yoksa yeni durumu `TAMAMLANDI` sayma.
5. Kabul sağlanırsa `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_STATE.md` içinde `TAMAMLANDI`, `active_stage:null`, `next_stage:null` ve canlı deployment kanıtları; yalnız durum kaydı için fazladan Production deploy üreten ikinci `main` push yapma. Gerekirse durum kaydı yayımlanacak checkpoint'te final-lokal alanıyla tasarlanmış olsun, son sonuç yerelde yazılsın.

**Kabul:** gerçek kullanıcı davranışı, PDF/alan kanıtı, hash koruması, final build, aynı commit/alias ile canlı smoke PASS. **Hata:** başarı demeden `ENGELLI`, gerekirse kontrollü rollback. **Kesin DUR: uygulama tamamlandı; ek `devam` işlem başlatmaz.**

---

## 8. Kalıcı durum ve `devam` protokolü

Yeni dosya: `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_STATE.md`. Eski planın `TAMAMLANDI` durumuna dokunma. İlk `başla/devam` öncesi örnek şema:

```yaml
plan_id: BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2
plan_revision: 2.0
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
active_stage: null
next_stage: ASAMA_01
completed_stages: []
evidence: []
blockers: []
updated_at: null
```

- Her aşamada `active_stage`, `next_stage`, son PASS/FAIL/SKIP/ÇALIŞTIRILMADI, test edilen `HEAD` veya dirty tree tanımı, çalıştırılan komut, 1–3 satırlık somut sonuç, sınır/engel ve güncelleme zamanı kaydedilir.
- Yarım aşama varsa yalnız o aşama sürdürülür; başarı kanıtı yoksa önceki çalışma otomatik PASS sayılmaz. `ENGELLI` durumunda engeli çözmeden bağımlı aşamaya geçme. Aynı başarısız komutu değişikliksiz sonsuz kez yeniden çalıştırma.
- Testler gerektirdiğinde önceki aşama kanıtını geçersiz kılan değişiklikler için **yalnız ilgili regresyonu** tekrar et; tüm modeli/planı baştan araştırma.
- **Bir mesaj = en fazla bir aşama**, sonraki aşama için mutlaka yeni `devam`. Plan `TAMAMLANDI` ve kullanıcı yalnız `devam` yazdıysa **hiçbir tool/kod/commit/test/deploy yok**.
- Kısa aşama raporu: “Aşama, dosyalar, kanıtlanan davranış, PASS/FAIL/SKIP, engel, sıradaki aşama.” **Kullanıcıya soru sorulmaz.**

---

## 9. Final kabul kriterleri — sınanabilir, gösterişsiz

- [ ] 56/56 alanın politika ve doğru PDF anahtarı/sayfası kaydı var; 3 PDF-only ve 7 FreeText edit hotspot değil.
- [ ] Mobil gerçek popup dokunması kapanmıyor; `tap`, yazma, `Vazgeç/Uygula`, pinch sonrası yanlış hotspot yok; OFF mod eski gesture davranışında gerileme yok.
- [ ] Aynı alan çatışmasında stale draft **güncel formData'yı ezmiyor**; başka alan değişimi ya da arada PDF render taslağı sessiz silmiyor. Çift onay tek commit.
- [ ] İstifa/sözleşme/taahhüt kritik adreslerde **fiziksel PDF sınırı dürüst gösteriliyor**, tam metin hem form hem gerçek PDF alan değerinde korunuyor; uzun adres hiç kısaltılmadan aynı font büyüklüğünde basılacağı yalanı yok.
- [ ] TCKN (11 hane/checksum, **resmî kişi doğrulaması değil**), tarih, telefon (önekli/yerel), YİBF, ücret: doğru ve yumuşak mesaj; serbest alanlarda gereksiz format sansürü yok; boş/`-`/default korunuyor.
- [ ] Sol form + sağ popup arasında uyarı aynı kurala bağlı, alan başına gereksiz çift uyarı yok; mobil/dark/light ve `aria-describedby` uyumlu.
- [ ] Bağlı imza, özel elle değiştirilmiş imza, `Sıfırla/Temizle/Geri al`, iki sayfa, PDF indir/yazdır/boş form, hata/retry, zoom/fit eskisi gibi çalışıyor.
- [ ] Korumalı PDF engine/hook/şablon binary/alan sözleşmesi/zoom/CAD/Dokümantasyon dosyaları başlangıç hash ile eşit.
- [ ] Gerçek React ve gerçek PDF üzerinden kritik testler PASS; sadece maket/E2E skip ile PASS ilan edilmiyor; build/typecheck/lint ve Vercel canlı commit/alias/smoke doğrulanıyor.
- [ ] Son `TAMAMLANDI` durumunda tek başına `devam` hiçbir işlem yapmıyor.

---

## 10. Kaynaklar ve belge ilişkisi

**GitHub kaynakları (main kaynak referansı, 17.10.2026):**

- https://github.com/smitelagwar/muhendislik-site/commit/14235bd4ff86f6d03f3a575d4650596cef57206e
- https://github.com/smitelagwar/muhendislik-site/blob/main/PROJECT.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/AGENTS.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/GEMINI.md
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/pdf-engine.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/document-field-contracts.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/documents-data.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-studio-pdf-preview.tsx
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-studio-inline-edit-layer.tsx
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/lib/belge-studio-inline-field-map.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/src/components/belge-field-length-warnings.tsx
- https://github.com/smitelagwar/muhendislik-site/blob/main/tests/site-audit/belgeler-inline-edit.spec.ts
- https://github.com/smitelagwar/muhendislik-site/blob/main/PLAN/BELGELER_PDF_INLINE_EDIT_STATE.md

**Planlama protokolü (17.10.2026 tekrar okundu):** https://drive.google.com/file/d/1NTyZ9w46wfozM-HH7HQ6rHzE-7HTqhDy/view?usp=drivesdk

**Hedef model resmî kaynaklar:** https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; https://ai.google.dev/gemini-api/docs/thinking

**Referans alınan önceki plan:** `BELGELER_PDF_ALAN_BAZLI_GUVENLI_AYARLAR_GEMINI_3_8_HIGH_PLAN.md` (önceki V1 taslağı). **Bu V2 eski tamamlanmış inline edit projesinden ayrı çalışmadır; V1'e göre gözden geçirilmiş nihai sürümdür.**

---

## 11. Gemini'ye yapıştırılacak ilk çalışma mesajı

> **Bu .md planını Windows'taki yerel `muhendis-mimar-portali` projemde Gemini 3.8 Flash (High) ile uygula. Bana hiçbir aşamada soru veya onay talebi gönderme. Önce `PROJECT.md`, `AGENTS.md`, `GEMINI.md`, ilgili Belgeler ve test kurallarını ve yalnız bu görevin V2 durum dosyasını oku. Önceki tamamlanmış inline edit planına dokunma. Çalışma ağacımı koruyarak yalnız ilk tamamlanmamış `ASAMA_nn` aşamasını uygula; o aşamanın gerçek kabul testlerini çalıştır, kanıtı `PLAN/BELGELER_INLINE_SAFETY_FIELD_QUALITY_V2_STATE.md` içine yaz ve DUR. Bir sonraki aşamaya ancak yeni bir `devam` mesajımdan sonra geç. Güvenilir çözüm yoksa riskli değişiklik yapma: `ENGELLI` ve somut neden kaydet, dur. PDF motoru, beş PDF şablonu, zoom/pinch matematiği ve mevcut belge işlemleri korunacak. Kodu değiştirmeden önce problemi gerçek testte kanıtla. Son release aşaması hariç commit/push/Production deploy yok. `TAMAMLANDI` durumunda `devam` hiçbir işlem başlatmaz.**

---

**Bu planın bilinçli sınırı:** Tek satırlık dar bir resmi PDF kutusuna her uzun adresi eksiksiz ve büyük puntoda sığdırmak mümkün değildir. Başarılı sonuç; **tam veriyi korumak, riskleri gerçek kanıta göre doğru göstermek, kullanıcıya güvenli seçim imkânı vermek, eski sistemde sıfır işlev kaybı sağlamak ve üretim sonucunu ölçerek doğrulamak** olacaktır. PDF şablonunun fiziksel boyutunu değiştirmek ayrı açık görev gerektirir.
