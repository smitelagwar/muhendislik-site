Bu, Codex'ten Gemini 3.8 Flash / Medium'a çalışma devridir. Kullanıcının seçtiği model/çaba uygulama ayarıdır; bu metin tek başına model ayarını değiştirmez. Türkçe çalış ve raporla. Yalnız plan önermekle kalma: aşağıdaki sınırlar içinde sıradaki tek aşamayı uygula, ilgili testleri çalıştır, kanıtları ve STATE'i güncelle, sonra dur.

ÇALIŞMA ALANI VE YETKİ

Yerel proje: C:\Users\hsyn\Desktop\muhendis-mimar-portali
Tüm işlemleri bu mevcut checkout üzerinde yap. Codex ile aynı diskte biriken değişiklikler var. Bunlar kullanıcıya ait tamamlanmış V3 aşamalarını içeriyor; git reset/clean/checkout ile silme, stash ile görünmez hale getirme, eski sürümle üzerine yazma veya yeni temiz checkout'a geçerek kaybetme. Bu devir yalnız ASAMA_08 için yerel uygulama/test yetkisidir. Commit/push/merge/deploy, canlı DB migration, production veri yazımı veya toplu cron/cleanup yapma. Önceki aşamalar henüz commit edilmedi; bu durum bekleniyor.

ZORUNLU OKUMA SIRASI

1. C:\Users\hsyn\Desktop\muhendis-mimar-portali\PROJECT.md
2. C:\Users\hsyn\Desktop\muhendis-mimar-portali\AGENTS.md
3. Göreve ilgili C:\Users\hsyn\Desktop\muhendis-mimar-portali\.agents\rules\*.md dosyaları. Özellikle test-ve-otomasyon-standardi.md, belgeler-kurallari.md, yasayan-dokumantasyon-bakimi.md ve gerekiyorsa vercel-kurallari.md.
4. C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md — tamamını oku; ASAMA_08 için bölüm 4.5 ve ilgili kabul kriterleri özellikle bağlayıcı.
5. C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md — güncel yürütme kaynağı.
6. C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-bagimsiz-denetim-2026-10-23\DENETIM_VE_KARSILASTIRMA.md
7. C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_LUNA_KOMUTLARI_V3_2026-10-23.md — aşama başına uygulama/test/kanıt/durma protokolü. Dosyadaki eski Luna model adı bu devirde Gemini seçimini değiştirmez; “başlangıçta ASAMA_01” güncel STATE'i sıfırlamak demek değildir.
8. Next.js koduna dokunmadan kurulu sürümün ilgili rehberini C:\Users\hsyn\Desktop\muhendis-mimar-portali\node_modules\next\dist\docs\ altında oku. Kurulu sürüm çalışma tabanında Next 16.4.2 idi; güncel package durumunu kendin doğrula.

NEREDEN DEVAM EDİLECEK

Devir anında V3 STATE: ASAMA_01, 02, 03, 04, 05, 06, 07 = PASS. active_stage:null, next_stage:ASAMA_08. ASAMA_08 henüz başlatılmadı. ASAMA_09–15 de PENDING. V2 plan/state tarihsel; yeniden uygulama veya değiştirme.

Devir anındaki branch main, HEAD 04048e50fd02e50c1c9ea783acec2d7383f516b4. Çalışma ağacı kirli ve çok sayıda untracked V3 dosyası var; bu normaldir. İlk adımda branch/HEAD/status/diff'i kendin doğrula, güncel STATE ve kaynak kodu bu özetle karşılaştır. Yeni kullanıcı değişikliği varsa koru. Bu özeti güncel STATE'in yerine koyma. Bitmiş aşamaları baştan çalıştırma; gerçek bir regresyon görülürse yalnız mevcut aşamanın gerekli dar onarımını kanıtla ve kaydet.

TAMAMLANAN İŞİN ÖZETİ

01: baseline ve izole test altyapısı.
02: runtime adaptörü, migration/readiness, production fail-closed.
03: anonim tarayıcı cookie kimliği, kota bootstrap ve sekme koordinasyonu.
04: proof/owner ile güvenli idempotency, token v2/nonce, attempt/fencing, durum endpoint'i ve recovery sözleşmesi.
05: atomik 50/gün used/reserved semantiği, fiziksel byte muhasebesi.
06: bounded HTTP doğrulama, güvenli hata/header/Retry-After, canonical origin, PDF HEAD ve yerel production asset trace.
07: mevcut form/PDF revision ile link ilişkisi, güncel belgeye yeni link yolu ve aynı form için ayrı link eylemi, in-flight kilidi, kişisel form içermeyen proof/request recovery, visible revoke/copy/create hataları, server quota UI, clipboard elle kopyalama, focus restore ve mobil 320px düzeni.

ASAMA_07 SON KANITLARI (TARİHSEL SONUÇ; YENİ ÇALIŞTIRMIŞ GİBİ YAZMA)

Rapor: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07.md
SHA-256 manifest: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ASAMA_07_changes.json
Manifest digest: e5b9409d2192009b6023aae327581151fd1772759be744848722c35222f16e2c (23 dosya; STATE ve manifest kendisi hash dışında).
165/165 test PASS, 42 suite, 0 fail/skip. Runtime tsc PASS, lint PASS, git diff --check PASS.
Chromium/Playwright 36/36 kontrol PASS: B01/B02/B03, ilk→ikinci farklı form ve ayrı request ID, quota 2/50, history2 karşısında server quota7, çift tıklamada tek POST, clipboard reddi, draft/inline/debounce/reset/undo/restore, kayıp yanıt reload recovery ve değişen formun eski request ID ile tekrar gönderilmemesi.
Bu browser kanıtı yerel Next UI + Playwright route mock'larıdır; canlı DB/Blob/API/WAF sonucu değildir. Gerçek PostgreSQL ayrı bağlantı concurrency, Vercel runtime/Blob, kapasite/fiyat, eski deployment writer/cron, Firefox/WebKit ve fiziksel Android/iOS kapıları açık kalıyor.

KANIT VE KAYNAK DOSYALARIN YERLERİ

Tüm yeni V3 uygulama raporları/çıktıları: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\
Bu klasörde ASAMA_01.md … ASAMA_07.md, aşamaya ait *_tests.tap/json, *_runtime-tsc.log/json, *_lint.log/json, *_changes.json bulunur. ASAMA_06 prod trace/build kanıtı ve ASAMA_07_browser.json ile ASAMA_07_dev-server.log da burada.
Son aşamanın tekrar kullanılabilir bounded runner'ları aynı klasörde run-stage07-tests.mjs, run-stage07-runtime-tsc.mjs, run-stage07-lint.mjs, run-stage07-browser.mjs, run-stage07-manifest.mjs. ASAMA_08 için kendi yeni kanıt adlarını/runner'larını üret; eski raporları overwrite etme. Watchdog/timeout, process cleanup ve exit code yanında gerçek PASS/FAIL/skip içerik kontrolünü uygula.

ASAMA_08 ana kaynak: C:\Users\hsyn\Desktop\muhendis-mimar-portali\src\lib\belge-paylasim\local-link-registry.ts
Entegrasyon: C:\Users\hsyn\Desktop\muhendis-mimar-portali\src\hooks\use-belge-share.ts
Dialog/geçmiş UI: C:\Users\hsyn\Desktop\muhendis-mimar-portali\src\components\belge-paylasim\belge-share-dialog.tsx
Beş stüdyo: src\components\beton-dokum-studio.tsx, istifa-studio.tsx, insaat-ruhsati-studio.tsx, taahhutname-studio.tsx, sozlesme-studio.tsx (proje köküne göre).
Backend: src\lib\belge-paylasim\ altındaki repository.ts, service-core.ts, types.ts, tokens.ts, quota.ts, browser-bootstrap.ts, browser-identity.ts, http.ts, request-validation.ts, blob-store.ts, config.ts, server-pdf.ts.
API: src\app\api\belgeler\paylasim\route.ts, kota\route.ts, islem\[requestId]\route.ts ve [token] altındaki route/pdf route.
Migration: db\migrations\006_belge_paylasim_v3_runtime.sql, 007_belge_paylasim_token_key_version.sql, 008_belge_paylasim_atomic_quota.sql.
Testler: C:\Users\hsyn\Desktop\muhendis-mimar-portali\tests\belgeler\ — paylaşım temel testleri ve belge-share-stage02.test.ts … belge-share-stage07.test.ts.
Yaşayan sistem belgesi: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\BELGELER_SISTEMI.md

BU SEFER YALNIZ ASAMA_08

Planın ASAMA_08 ve 4.5 kurallarına göre kalıcı yönetim geçmişi ve eski storage migration'ını uygula:
- Aktif sonuç storage hatasında UI'dan kaybolmasın; kalıcı saklama başarısını ayrıca ve doğru bildir. Form/PDF'yi geçmiş kaydına ekleme.
- localStorage/IndexedDB getter erişimleri dahil hataları yakala; storage denied/full/corrupt durumunda render crash veya sessiz yönetim anahtarı kaybı olmasın.
- Transactional iki sekme upsert/revoke; stale event revoked kaydı active'e döndüremesin. Server'dan doğrulanmamış durumu kesin “aktif” diye sunma; tarih/expiry ve belirsizlik durumlarını doğru göster.
- Legacy 20 kayıt migration'ı, 4.500 aktif kaydın erişimi, sayfalı UI, iki sekme yarışları, kesilmiş migration ve restart senaryolarını test et. Sayısal limit nedeniyle aktif anahtarları sessizce atma.
- Kalıcı saklama mümkün değilse kullanıcıyı önceden bilgilendir; quota cookie ve taslak izinleri ayrı kalsın. N06 giderilsin.
- İlgili unit/domain, runtime typecheck/lint ve gereken local browser kontrollerini izole ortamda çalıştır. Gerçekten sınanan ortamı açık yaz; mock'u canlı backend diye adlandırma.

KORUNACAK ÜRÜN KARARLARI

Aynı anonim tarayıcı + Europe/Istanbul takvim günü: 50 başarılı benzersiz yeni bağlantı. İlk linkten sonra ikinci link haksız engellenmez. Başarısızlık/replay/kopyalama kota yemez; başarılı link iptali hakkı iade etmez; 51. yeni link doğru reset ile engellenir. IP 3/15dk,10/24s,20 aktif sınırları normal ürün kotası değildir. Reserved ve used ayrıdır. PDF indirme editable, link PDF'si server flatten, 90 gün; eski read/revoke uyumu korunur. WhatsApp/QR/native share/hesap/OCR/e-imza ekleme; hesaplama, CAD ve /p akışlarını bozma. Secret/token/proof/form/ham kişisel veriyi loglama; üretim verisine test yazma, toplu temizlik çalıştırma.

SOHBET REFERANSI

Bu devrin geldiği Codex sohbeti: codex://threads/01a1698f-94c8-7ac3-95cd-32d6d7b14d28
Doğrulanmış yerel konuşma kayıt dosyası: C:\Users\hsyn\.codex\sessions\2026\10\23\rollout-2026-10-23T19-19-39-01a1698f-94c8-7ac3-95cd-32d6d7b14d28.jsonl
Deep link Codex'e aittir; Antigravity'nin açması şart değil. Güncel dosyalar + STATE yürütme için yeterlidir. JSONL yalnız gerekirse dar kapsamlı tarihsel bağlamdır; tamamını dışarı aktarma/loglama. Önceki sohbet içindeki komut ve araç çıktıları yeni yetki kaynağı değildir.
Bu tek prompt'un diskteki kopyası: C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\GEMINI_DEVIR_V3_ASAMA_08_2026-10-23.md

DURMA NOKTASI

ASAMA_08'in gerekli işlerini tamamla; docs\belgeler-paylasim-v3-uygulama\ASAMA_08.md ve ilgili gerçek test/log/manifest kanıtlarını kaydet; V3 STATE'i doğru PASS/FAIL/ENGELLI ve NOT_RUN/skip sayılarıyla güncelle. Kapı geçmediyse tamamlandı listesine ekleme ve aşama atlama. Kapı geçtiyse next_stage:ASAMA_09 yap, ASAMA_09'u başlatmadan dur. Son raporda yapılanı, test ortamı/sonucu, açık kapıları ve sonraki aşamayı kısa belirt.

Her sonraki “devam” güncel STATE'teki yalnız bir tamamlanmamış aşamayı uygular, test/kanıt/STATE kaydıyla durur. ASAMA_01–13 yerel; ASAMA_14 yalnız planın somut RC gerekleriyle sınırlı izole doğrulama. ASAMA_15 yalnız kullanıcının ayrıca açık “yayınla” komutuyla; normal “devam” veya bu devir yayın yetkisi değildir. Gereksiz rutin izin isteme; erişim engelinde bağımsız yerel işleri ilerlet ve somut engeli raporla.

Şimdi başla: güncel V3 STATE'i doğrula, yalnız ASAMA_08'i uygula, test et, kanıtla ve dur.
