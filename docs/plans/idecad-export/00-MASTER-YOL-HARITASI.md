# hsynCAD — `.ide11trial` / `IdeProject` $\rightarrow$ `.ide11` ve `.ide10` Dönüştürücü Master Yol Haritası

> **HEDEF MODEL:** Gemini 3.8 Flash (High)
> **ÇALIŞMA MODU:** Sıfır İnisiyatif / Sıfır Seçenek / Deterministik Aşamalı Uygulama (REA Kanıt Tabanlı)
> **KAPSAM:** `src/lib/hsyncad/**`, `src/components/hsyncad/**`, `tests/hsyncad/**`

---

## 1. Gemini 3.8 Flash (High) İçin Kesin Uygulama Kuralları (ZORUNLU)

Bu planı uygularken aşağıdaki kuralların dışına çıkılması **kesinlikle yasaktır**:

1. **Seçenek Üretme / Tahmin Yasağı:**
   - Dosya yolları, fonksiyon imzaları, byte offsetleri ve algoritmalar ilgili faz dosyalarında **birebir** verilmiştir.
   - Kendi başına alternatif mimari kurma, ek kütüphane (`npm install`) yükleme veya mevcut çalışan fonksiyonların imzasını bozma.
2. **Dokunulması Yasak Alanlar (Protected Scope):**
   - `src/components/dokumantasyon/**` ve `src/lib/dokumantasyon/**` altındaki hiçbir dosyaya **dokunma**.
   - `C:\Program Files\ideCAD\**` altındaki hiçbir ikili (`.exe` / `.dll`) dosyaya yazma veya değiştirme işlemi **yapma**. Tüm çalışma salt-okunur REA bulgularına dayalı yerel TypeScript buffer dönüştürmesidir.
3. **Takılma / Sonsuz Döngü Önleme Kuralları (`.agents/rules/test-ve-otomasyon-standardi.md`):**
   - PowerShell'de çıplak `curl` komutu **kullanma**.
   - Birim testlerini çalıştırırken `npm test` yerine yalnızca hedef dosyayı çalıştır:
     ```powershell
     npx tsx --test src/lib/hsyncad/ide-binary-export.test.ts
     ```
   - Bir komut veya test hata verirse aynı komutu değiştirmeden tekrar tekrar çalıştırma; hatanın satır numarasını oku, ilgili faz dosyasındaki referans kodla birebir eşitle ve yeniden dene.
   - Her fazın sonunda yer alan **ÇIKIŞ KAPISI (Exit Gate)** komutu `PASS` olmadan bir sonraki faza **geçme**.

---

## 2. Mimari Özet ve REA Bulguları

Statik REA incelemesi (`C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\ide10-2026-10-28\`) sonucunda `.ide10`, `.ide11` ve `.ide11trial` taşıyıcılarının (carrier) ikili yapısı eksiksiz çözülmüştür:

| Özellik | `.ide10` (Native v10) | `.ide11` (Native v11) | `.ide11trial` (v11 Trial) |
| :--- | :--- | :--- | :--- |
| **Header `0..73` (74B)** | `IDE BUILDING DESIGNER...` | `IDE BUILDING DESIGNER...` | `IDE BUILDING DESIGNER...` |
| **Offset `74..77` (`u32` LE)** | `201094` (`0x00031186`) | `211220` (`0x00033914`) | `211220` (`0x00033914`) |
| **Offset `78` (`u8` Flag)** | `0` (`raw`) | `0` (`raw`) | `1` (`ide11trial` encoded) |
| **Offset `79..82` (`u32` LE)** | Toplam dosya boyutu (`byteLength`) | Toplam dosya boyutu (`byteLength`) | Toplam dosya boyutu (`byteLength`) |
| **Offset `83..86` (`u32` LE)** | `(~crc32(bytes[88..EOF])) >>> 0` | `(~crc32(bytes[88..EOF])) >>> 0` | `(~crc32(bytes[88..EOF])) >>> 0` |
| **Kat Başlığı (`storyHeader`)** | `56` byte (`height @+26`, `idx @+44`) | `60` byte (`height @+26`, `idx @+48`) | `60` byte (`height @+26`, `idx @+48`) |
| **`commonRecord` `data+28`** | Ek `u32` yok (`extraRefSize = 0`) | `+4` byte `u32` kat ref (`extraRefSize = 4`) | `+4` byte `u32` kat ref (`extraRefSize = 4`) |
| **`commonRecord` `list0` Sonrası** | `0` byte dolgu (`postList0Padding = 0`) | `0` byte dolgu (`postList0Padding = 0`) | `16` byte `rand()` dolgu (`postList0Padding = 16`) |
| **`commonRecord` `nativeZ` & `width`** | `1.0 * Z`, `1.0 * width` (IEEE-754) | `1.0 * Z`, `1.0 * width` (IEEE-754) | `2.0 * Z`, `3.0 * width` (Blowfish `f64`) |
| **Döşeme (`0x04cb`) Kaydı** | `slabExtra = 0`, `designAxes @p+692` | `slabExtra = 4` (`u32(36) @p+470`), `designAxes @p+780` | `slabExtra = 4` (`u32(36) @p+470`), `designAxes @p+780` |
| **Kesit Etiketleri (`beam`/`wall`)** | Gerçek metin (`"25/50"`, `"485/25"`) | Gerçek metin (`"25/50"`, `"485/25"`) | `"XX"` (`0x58, 0x58`) |

### Neden İki Hedef Format (`.ide11` ve `.ide10`) Birlikte Sunuluyor?

1. **`.ide11` Dışa Aktarım (Native v11 Decoded Carrier — `version=211220, flag=0`):**
   - `.ide11trial` ile **birebir aynı şema sürümünü (`211220`)** kullanır.
   - Kayıt dışı tablolarda sürüm farkı yoktur; yalnızca `encodedFlag = 0` yapılır, kat/eleman kayıtlarındaki Blowfish `float64` blokları standart IEEE-754 `float64`'e çevrilir, `nativeZ`/`width` çarpanları (`2x`, `3x`) kaldırılır, `list0` sonrasındaki `16` byte rastgele dolgu çıkarılır, `"XX"` kesit etiketleri (`"25/50"` vb.) geri yazılır ve `offset 83..86` CRC32 güncellenir.
2. **`.ide10` Dışa Aktarım (Native v10 Carrier — `version=201094, flag=0`):**
   - İki tamamlayıcı mod içerir:
     - **Mod A (Donör/Eşleşen `.ide10` Cerrahi Yama — %100 ideCAD v10 Uyumlu):** Kullanıcının elinde projenin baz `.ide10` dosyası varsa (`MUSTAFA SELVİ 1.KISIM.ide10` gibi), `.ide11trial` veya `IdeProject` içindeki tüm geometri, kat, döşeme yükü ($G/Q$), boyut ve kot güncellemeleri `nativeId` üzerinden doğrudan `.ide10` ikili taşıyıcısına yamalanır ve CRC32 (`offset 83..86`) yeniden hesaplanır.
     - **Mod B (Bağımsız `.ide11trial` $\rightarrow$ `.ide10` Kayıt İndirgeme / Standalone Downgrade):** Baz `.ide10` dosyası yoksa, `211220` kayıtları `201094` şemasına (`storyHeader: 60 -> 56B`, `extraRefSize: 4 -> 0B`, `postList0Padding: 16 -> 0B`, `slabExtra: 4 -> 0B`, `designAxisShift: 88 -> 0B`) indirgenerek bağımsız `.ide10` dosyası üretilir.

---

## 3. Faz Sırası ve Dosya Haritası

Uygulama **5 sıralı fazdan** oluşur. Her fazın detayları kendi Markdown dosyasında yer alır:

| Faz | Plan Dosyası | Üretilecek / Güncellenecek Kod Dosyaları | Tahmini Süre |
| :--- | :--- | :--- | :--- |
| **Faz 1** | [`01-FAZ1-REA-FORMAT-VE-CRC32-SOZLESMESI.md`](./01-FAZ1-REA-FORMAT-VE-CRC32-SOZLESMESI.md) | `src/lib/hsyncad/ide-import/ide-binary-codec.ts` *(yeni)*<br>`src/lib/hsyncad/ide-import/numeric-codec.ts` *(güncelleme)*<br>`src/lib/hsyncad/ide-import/index.ts` *(güncelleme: `"ide11"` desteği)* | ~5 dk |
| **Faz 2** | [`02-FAZ2-IDE11TRIAL-TO-IDE11-TRANSCODER.md`](./02-FAZ2-IDE11TRIAL-TO-IDE11-TRANSCODER.md) | `src/lib/hsyncad/ide-import/ide11-transcoder.ts` *(yeni)* | ~10 dk |
| **Faz 3** | [`03-FAZ3-IDE10-DOWNGRADE-VE-DONOR-EXPORT.md`](./03-FAZ3-IDE10-DOWNGRADE-VE-DONOR-EXPORT.md) | `src/lib/hsyncad/ide-import/ide10-exporter.ts` *(yeni)* | ~10 dk |
| **Faz 4** | [`04-FAZ4-ARAYUZ-VE-EXPORT-ENTEGRASYONU.md`](./04-FAZ4-ARAYUZ-VE-EXPORT-ENTEGRASYONU.md) | `src/lib/hsyncad/ide-export.ts` *(güncelleme)*<br>`src/components/hsyncad/ide-file-menu.tsx` *(güncelleme)*<br>`src/components/hsyncad/ide-project-panel.tsx` *(güncelleme)* | ~8 dk |
| **Faz 5** | [`05-FAZ5-TEST-DOGRULAMA-VE-KABUL-KRITERLERI.md`](./05-FAZ5-TEST-DOGRULAMA-VE-KABUL-KRITERLERI.md) | `src/lib/hsyncad/ide-binary-export.test.ts` *(yeni)*<br>`tests/hsyncad/ide-exports.spec.ts` *(güncelleme)* | ~7 dk |

---

## 4. Kullanıcı İçin Gemini 3.8 Flash (High) Komut Şablonları

Gemini 3.8 Flash (High) modeline işi verirken tek seferde tüm projeyi anlatmak yerine aşağıdaki kısa istemleri sırayla (veya tek bir sıralı görev olarak) verebilirsiniz:

- **Adım 1:**
  > `docs/plans/idecad-export/00-MASTER-YOL-HARITASI.md` ve `docs/plans/idecad-export/01-FAZ1-REA-FORMAT-VE-CRC32-SOZLESMESI.md` dosyalarını oku. Hiçbir ek seçenek üretmeden Faz 1'i birebir uygula ve Çıkış Kapısı komutunu çalıştırıp sonucu göster.
- **Adım 2:**
  > `docs/plans/idecad-export/02-FAZ2-IDE11TRIAL-TO-IDE11-TRANSCODER.md` dosyasını oku. Faz 2'yi birebir uygula ve Çıkış Kapısı testini çalıştır.
- **Adım 3:**
  > `docs/plans/idecad-export/03-FAZ3-IDE10-DOWNGRADE-VE-DONOR-EXPORT.md` dosyasını oku. Faz 3'ü birebir uygula ve Çıkış Kapısı testini çalıştır.
- **Adım 4:**
  > `docs/plans/idecad-export/04-FAZ4-ARAYUZ-VE-EXPORT-ENTEGRASYONU.md` ve `docs/plans/idecad-export/05-FAZ5-TEST-DOGRULAMA-VE-KABUL-KRITERLERI.md` dosyalarını oku. Faz 4 ve Faz 5'i uygula, birim testlerini ve tip kontrolünü (`npx tsc --noEmit`) çalıştırıp bitir.
