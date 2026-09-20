# G03 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D06, D13 · R05, R16, R17 |
| G / SES / başlangıç SNAP / son SNAP | G03 · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G00 ve G02 tamamlandı; D13 ve 31 sözleşmeleri uygulandı |

## Uygulanan davranış

- Kanonik 2D şema (`src/lib/cad-v2/canonical/types.ts`) Float64 dünya koordinatları, katmanlar, stiller, bloklar ve varlıklar ile oluşturuldu.
- DV2SCN01 ikili sahne protokolü (`src/lib/cad-v2/protocol/binary-protocol.ts`) 32 byte başlık, 32 byte section table, little-endian typed array aralıkları, 8-byte hizalama ve 2 MiB / 8 MiB tavan kontrolleriyle yazıldı.
- Round-trip serileştirme/ayrıştırma ve negatif testler (bozuk magic, kesilmiş buffer) çalıştırıldı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/protocol/binary-protocol.ts` | Ekleme | D13, 31 ikili protokol sözleşmesi | Yeni dosya | Bağımsız V2 |
| `tests/cad-v2/binary-protocol.test.ts` | Ekleme | G03 doğrulama ve negatif testler | Yeni dosya | İzolasyon korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R05, R16, R17 | `npx tsx tests/cad-v2/binary-protocol.test.ts` | RUN-0004 / SNAP-0001 | PASS (exit 0) | — |

## Başarısızlık ve düzeltmeler

Herhangi bir hata oluşmadı; protokol sözleşmesi kilit belgelerle birebir eşleşti.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım G04 (Arayüz durum prototipi ve erken etkileşim kapısı).

## Uygulayıcı kapanışı

G03 başarıyla tamamlandı ve test edildi.
