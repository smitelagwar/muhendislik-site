# Oturum devri şablonu

[Dizin](../README.md) · [Gemini rehberi](../18_GEMINI_UYGULAMA_REHBERI.md) · [Kayıt sözleşmesi](../20_KAYIT_VE_KANIT_SISTEMI.md)

**Durum:** Şablon; bu oturumun sonuçları için [teslim durumu](../17_TESLIM_VE_DURUM.md) okunur.

Gerçek Gemini çalışması için SES kimliğiyle kopyala. Gizli düşünce zinciri yerine yapılan eylem, kısa gerekçe, gözlem ve testleri yaz. Aşağıdaki kayıtlar uydurularak tamamlanmaz. Bağımsız Astra kabulü ayrı kalır.

## Başlangıç bağlamı

SES, UTC başlangıç/bitiş, EXEC revizyonu, branch/HEAD, başlangıç/son SNAP, güncel kapsam ve önceden var olan uncommitted değişiklikler. Başka işlerin değişikliklerini kendine ait diye yazma.

## Bu oturumda tamamlananlar

G/R/UI/FIX kimlikleriyle gerçekte yapılan iş, değişen dosya/semboller, nedenleri; gerçek RUN/ART/SNAP bağlantıları, tam komut/test sayıları ve PASS/FAIL/DEGRADED/NOT_RUN ayrımı. Görsel alındı mı, gerçekten açılıp incelendi mi?

## Devam edenler

Açık G/R/CR/FIX, başarısızlığın somut nedeni, ilk ve son RUN; bekleyen bağımlı iş ile 19'a göre bağımsız ilerlenebilir iş ayrımı. Gemini yeni çözüm yolu seçmez.

## Korunan sınırlar

Mevcut core fingerprint, source/storage güvenliği, veri aktarımı/dependency/remote write durumu. V2 varsayılan olmadıysa bunu açık kaydet.

## Sonraki somut adım

İlk açılacak dosya/rapor, çalıştırılacak mevcut komut veya uygulanacak küçük dilim. Neden bu adım? Ne gözlenince başarı/başarısızlık kararı verilecek?

## Kaynaklar

Geçerli ADR, experiment ve fixture manifest bağlantıları. Artık geçersiz plan/kararları tarihsel diye işaretle; yeni oturumun onları tekrar uygulamasını önle.
