# RUN — Gerçek test çalıştırma kaydı

[Dizin](../README.md) · [Kayıt sözleşmesi](../20_KAYIT_VE_KANIT_SISTEMI.md)

**ŞABLON — test çalışmadı.** Her çalıştırma yeni RUN alır; başarısız kaydın üzerine PASS yazılmaz.

| Alan | Değer |
|---|---|
| RUN / SES / G / R / FIX | Doldurulmadı |
| Geçerli EXEC / SNAP / HEAD + dirty tree kimliği | Doldurulmadı |
| Tam komut / cwd | Doldurulmadı |
| Config profili / fixture ID ve SHA-256 | Doldurulmadı |
| Node / OS / browser / fiziksel cihaz veya emülasyon | Doldurulmadı |
| Source revision / decoder / aktif engine / asset hash | Doldurulmadı |
| Mock kullanımı / gerçek API / gerçek decode | Doldurulmadı |
| Cache ve ağ koşulu | Doldurulmadı |
| Başlangıç / bitiş UTC / süre / timeout | Doldurulmadı |
| Başlatılan owned süreç / cleanup | Doldurulmadı |
| Exit code | null — çalıştırılmadı |
| Test toplam / passed / failed / skipped | null — çalıştırılmadı |
| Ham stdout/stderr/rapor ART yolu ve hash | Doldurulmadı |
| Sonuç | NOT_RUN |

## Assert edilen davranış

Gerçek input, eylem, beklenen bağımsız oracle, ölçülen sonuç ve tolerans. Test dosyasının adı yeterli değildir. Beklenen hata ile testin kendi hatasını ayır.

## Ham kanıt değerlendirmesi

Exit code ve loglar tutarlı mı? Önceden çalışan eski dev server/worker var mı? Yeni kod testten sonra değişti mi? UI golden kaynağı bağımsız mı? Güvenli config profilinde redaksiyon yapıldı mı?

## Sonuç ve takip

Başarısızlık/skip sebebi, etkilenen R, sonraki RUN/FIX/CR. Çalıştırılmayan kontrolde süre/sayı/başarı uydurma.
