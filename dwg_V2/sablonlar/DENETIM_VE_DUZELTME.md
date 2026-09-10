# AUD / FIX — Bağımsız denetim ve düzeltme şablonu

[Dizin](../README.md) · [Denetim protokolü](../23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**ŞABLON — denetim yapılmadı, bulgu yok anlamına gelmez.** AUD kaydı denetimler, FIX kaydı duzeltmeler dizininde ayrı dosya olur.

## Astra'nın AUD kaydı

AUD kimliği, tarih, incelenen EXEC/SNAP/HEAD, kaynak/asset/config kapsamı, Gemini devir kimliği; incelenen R'lerin tamamı; bağımsız RUN/ART; kanıtsız maddeler; yerel/cihaz/production sonuçları. Her bulgu için aşağıdaki FIX alanları.

## Astra'nın FIX talimatı

| Alan | Değer |
|---|---|
| FIX / AUD / R / G / UI / D | Doldurulmadı |
| Öncelik / durum | Atanmadı |
| Sorun / kullanıcı etkisi | Doldurulmadı |
| Reproducer / source file:line veya sembol / SNAP | Doldurulmadı |
| Beklenen / gözlenen / kanıt ART | Doldurulmadı |
| Seçilmiş tek düzeltme yolu | Astra dolduracak |
| Değişecek dosya/sınır | Astra dolduracak |
| Dokunulmayacak alan | Astra dolduracak |
| Bağımlı FIX / uygulama sırası | Astra dolduracak |
| Exact kabul davranışı / test / tolerans | Astra dolduracak |
| Mimari değişiklik gerekiyorsa EXEC revizyonu | Astra dolduracak |

## Gemini'nin uygulama kaydı

İlk hatayı tekrarlayan RUN, değişen dosyalar, kısa düzeltme özeti, son SNAP, yeni test ve görsel ART, etkilenen regresyonlar, kalanlar/CR. Durum en fazla IMPLEMENTER_VERIFIED olur; bağımsız kabul yazılmaz.

## Astra'nın yeniden kontrolü

Son SNAP doğrulandı mı? İlk reproducer ve etkilenen R'ler geçti mi? İlgili regresyon ve görsel ekran yeniden açıldı mı? Bağımsız RUN/ART, sonuç, yeniden açılma gerekçesi veya ACCEPTED ve tarih. Önceki başarısız kayıt korunur.
