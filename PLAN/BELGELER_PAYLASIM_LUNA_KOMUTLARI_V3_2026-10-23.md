# Luna için kopyalanacak komutlar — Belgeler Paylaşımı V3

Çalışma alanı: `C:\Users\hsyn\Desktop\muhendis-mimar-portali`.
Kullanıcının seçtiği model/çaba: **GPT 6 Luna / Extra High**. Model ve çabayı uygulamanın seçiminden ayarla; bu metni yapıştırmak model ayarını değiştirmez.

## 1. İlk mesaj — aynen kopyala

```text
C:\Users\hsyn\Desktop\muhendis-mimar-portali projesinde çalış.

Önce PROJECT.md, AGENTS.md ve ilgili .agents/rules dosyalarını oku. Ardından aşağıdaki üç dosyayı eksiksiz oku:

1) C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md
2) C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
3) C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-bagimsiz-denetim-2026-10-23\DENETIM_VE_KARSILASTIRMA.md

Bu V3 planı uygula. Eski V2 plan/state dosyalarını yeniden uygulama veya değiştirme. Kullanıcının görseldeki isteği zorunlu: aynı anonim tarayıcı için İstanbul takvim gününde 50 başarılı benzersiz yeni paylaşım bağlantısı; ilk linkten sonra ikinci link haksız engellenmeyecek. Eski IP 3/15dk,10/24s,20 aktif sınırları normal akıştan çıkacak. Başarısız denemeler/replay/kopyalama kotayı tüketmeyecek; 51. yeni link doğru reset zamanı ile engellenecek.

Bu mesajla yalnız STATE'teki ilk tamamlanmamış aşamayı uygula (başlangıçta ASAMA_01). Güncel HEAD/diff ile planın kaynak tabanını karşılaştır; kullanıcı değişikliklerini koru. Gereken yerel inceleme/test/kanıt işlerini tamamla, STATE'i gerçek sonuçlarla güncelle ve dur. Her sonraki “devam” en fazla bir aşama uygular. Gereksiz rutin izin isteme; eksik bilgi/erişim varsa bağımsız işleri ilerlet ve somut engeli bildir.

İndirilen PDF editable, linkteki PDF server flatten, 90 gün ve eski link/read/revoke uyumu korunacak. WhatsApp, QR, native share, hesap, OCR/e-imza ekleme. Hesap formülleri, CAD ve /p paylaşımını bozma. Gerçek üretim verisine test yazma, toplu cron/temizlik çalıştırma, secret/token/form verisini loglama. Testler yalnız izole adaptör/ortamda; tarayıcı mock'unu gerçek backend testi diye raporlama.

ASAMA_01–13 yerel; ASAMA_14 yalnız V3'te belirtilen somut RC gereğiyle sınırlı izole doğrulama. Ara push/deploy döngüsü yok. ASAMA_15'i normal “devam” ile başlatma; ben ayrı “yayınla” komutunu vereceğim. Şimdiki talep bu ilk aşamayı tamamlamandır.

Yeni uygulama kanıtlarını C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\ altında tut. Her aşama sonunda yapılanlar, PASS/FAIL/NOT_RUN (skip sayısı dahil), açık engel ve sonraki aşamayı kısa yaz. Eski denetimdeki PASS sayılarını yeni çalıştırmış gibi kullanma. Mevcut tanı probları bug'ı gözlüyor; fix testleri beklenen güvenli davranışı assert etmeli. STATE TAMAMLANDI ise hiçbir yeni işlem başlatma.

Başla: yalnız sıradaki aşamayı uygula, kanıtla ve dur.
```

## 2. Aşama ilerletme

```text
V3 STATE'i yeniden oku. Yalnız sıradaki tamamlanmamış aşamayı uygula; ilgili testleri çalıştır, kanıtı ve STATE'i güncelle, dur. ASAMA_15'e otomatik geçme.
```

Aynı sohbet içinde kısa **`devam`** da yeterlidir. Bir aşama hata aldıysa `devam` aynı aşamayı onarır; aşama numarasını başarısızlık üstünden atlatmaz.

## 3. Yeni sohbetten devam

İlk mesajı tekrar kullan; “başlangıçta ASAMA_01” ifadesi yeni state'i sıfırlamak anlamına gelmez. Güncel STATE'teki active/next aşama esas alınır. Bitmiş eski V2 uygulamasını baştan kurma.

## 4. Yalnız hazır sonucu yayımlamak istediğinde

```text
Yayınla. C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md ve güncel V3 STATE'e göre ASAMA_15'i uygula.

ASAMA_14'ün zorunlu release kapıları PASS değilse yayın yapma; eksik olan somut kapıyı bildir. PASS ise önceden doğrulanmış değişiklikleri AGENTS.md ve V3'te seçilen yayın yoluyla tek anlamlı release olarak yayımla. Tek production deployment, doğru SHA/artifact ve canonical alias kontrolü yap. Bu yayın komutuyla, READY sonrasında planın önceden tanımlanmış tek bounded sentetik browser/API smoke'unu ve yalnız kendi test bağlantılarının iptalini de açıkça istiyorum. Canlıda 50/100 link yük testi veya toplu cron çalıştırma. Gereksiz ek CLI/push döngüsü yok.

Sonucu STATE ve docs\belgeler-paylasim-v3-uygulama\FINAL_AUDIT.md içine kanıtla. Kritik hata varsa TAMAMLANDI yazma; güvenli dar rollback/onarım durumunu bildir. Başarılıysa TAMAMLANDI/next_stage:null ile bitir ve dur.
```

## 5. Uygulama bitince bağımsız kontrol için verilecek mesaj

```text
Belgeler Paylaşımı V3 uygulandı. Repo: C:\Users\hsyn\Desktop\muhendis-mimar-portali

Plan: C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md
State: C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md
Son rapor: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\FINAL_AUDIT.md
Önceki bağımsız denetim: C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-bagimsiz-denetim-2026-10-23\DENETIM_VE_KARSILASTIRMA.md

Raporlardaki PASS iddialarını kaynak/testlerle bağımsız doğrula. Özellikle ilk→ikinci link, gerçek 50/gün, aynı NAT iki browser, pending/gece yarısı, failed retry, tombstone sonrası token dirilmesi, eski linkler, fiziksel byte/cleanup throughput, storage4500, mobil320 ve görünmeyen revoke hatasını denetle. Uygulanan HEAD/diff'i kendin kaydet. Kod/DB/deploy değiştirmeden kalan eksikler için kanıtlı, aşamalı yeni düzeltme planı çıkar; doğrulanamayanları kesin bug diye sunma.
```
