# BELGELER UX V3 — ASAMA_00 KEŞİF NOTLARI

> **Tarih:** 23 Ekim 2026
> **Plan:** `BELGELER_UX_SECTION_DRAFT_FOCUS_2026_10_V3`
> **Aşama:** `ASAMA_00` — Yerel keşif ve baseline doğrulama

---

## 1. 5 Belge ve 56 Düzenlenebilir Alan Haritası

Aşağıdaki matris, 5 stüdyonun güncel kaynak kodundaki JSX grupları, input/textarea ID'leri, görünür başlıkları ve oluşturulacak akıllı bölüm (`sectionId`) eşleştirmesini belgeler.

### 1.1 Beton Döküm Tutanağı (`beton-dokum-tutanagi`) — Önerilen Pilot (10 Alan)
- **DOM Öneki:** `beton-dokum-`

| fieldKey | DOM Input ID | Mevcut JSX Grubu | sectionId | Görünür Alan Başlığı |
|---|---|---|---|---|
| `tutanak_alt_baslik` | `beton-dokum-tutanak_alt_baslik` | 1. Belge & Kayıt | `belge-kayit` | Tutanak Alt Başlığı |
| `tarih` | `beton-dokum-tarih` | 1. Belge & Kayıt | `belge-kayit` | Tarih |
| `yibf` | `beton-dokum-yibf` | 1. Belge & Kayıt | `belge-kayit` | YİBF No |
| `yer` | `beton-dokum-yer` | 2. Şantiye Yeri | `santiye-yeri` | Şantiye Yeri (İl/İlçe/Mahalle/Ada/Parsel) |
| `olay_aciklamasi` | `beton-dokum-olay_aciklamasi` | 3. Olay Açıklaması & Gözlem | `olay-gozlem` | Olay Açıklaması |
| `gozlem_notlar` | `beton-dokum-gozlem_notlar` | 3. Olay Açıklaması & Gözlem | `olay-gozlem` | Gözlem ve Notlar |
| `laboratuvar` | `beton-dokum-laboratuvar` | 4. İmzacı Taraflar | `imzaci-taraflar` | 1. Laboratuvar |
| `muteahhit` | `beton-dokum-muteahhit` | 4. İmzacı Taraflar | `imzaci-taraflar` | 2. Müteahhit |
| `santiye_sefi` | `beton-dokum-santiye_sefi` | 4. İmzacı Taraflar | `imzaci-taraflar` | 3. Şantiye Şefi |
| `yapi_denetim` | `beton-dokum-yapi_denetim` | 4. İmzacı Taraflar | `imzaci-taraflar` | 4. Yapı Denetim |

### 1.2 İnşaat Ruhsatı Dilekçesi (`insaat-ruhsati-dilekcesi`) (8 Alan)
- **DOM Öneki:** `insaat-ruhsati-`

| fieldKey | DOM Input ID | Mevcut JSX Grubu | sectionId | Görünür Alan Başlığı |
|---|---|---|---|---|
| `tarih` | `insaat-ruhsati-tarih` | 1. İdare ve Tarih Bilgisi | `idare-ve-tarih` | Dilekçe Tarihi |
| `belediye_adi` | `insaat-ruhsati-belediye_adi` | 1. İdare ve Tarih Bilgisi | `idare-ve-tarih` | İlgili Belediye / İdare |
| `mudurluk_adi` | `insaat-ruhsati-mudurluk_adi` | 1. İdare ve Tarih Bilgisi | `idare-ve-tarih` | İlgili Birim / Müdürlük |
| `ana_metin` | `insaat-ruhsati-ana_metin` | 2. Talep ve Parsel Bilgileri Metni | `talep-metni` | Talep ve Parsel Bilgileri Metni |
| `ad_soyad` | `insaat-ruhsati-ad_soyad` | 2. Dilekçe Sahibi | `dilekce-sahibi` | Adı Soyadı |
| `unvan` | `insaat-ruhsati-unvan` | 2. Dilekçe Sahibi | `dilekce-sahibi` | Sıfat / Unvan |
| `adres` | `insaat-ruhsati-adres` | 3. İletişim ve Tebligat Adresi | `iletisim-adres` | Adres Bilgisi |
| `tel` | `insaat-ruhsati-tel` | 3. İletişim ve Tebligat Adresi | `iletisim-adres` | Telefon Numarası |

### 1.3 Şantiye Şefi İstifa Dilekçesi (`santiye-sefi-istifa-dilekcesi`) (10 Alan + 3 PDF-Only Etiket)
- **DOM Öneki:** `istifa-`

| fieldKey | DOM Input ID | Mevcut JSX Grubu | sectionId | Görünür Alan Başlığı |
|---|---|---|---|---|
| `hitap_1` | `istifa-hitap_1` | 1. İdare ve Kurum Hitabı | `idare-hitap` | Hitap Başlığı |
| `hitap_2` | `istifa-hitap_2` | 1. İdare ve Kurum Hitabı | `idare-hitap` | İlçe / Şehir |
| `ana_paragraf` | `istifa-ana_paragraf` | 2. Dilekçe ve Ayrılma Metni | `dilekce-metni` | İstifa & Proje Açıklaması |
| `sonuc_cumlesi` | `istifa-sonuc_cumlesi` | 2. Dilekçe ve Ayrılma Metni | `dilekce-metni` | Sonuç & Talep Cümlesi |
| `tarih` | `istifa-tarih` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | Dilekçe Tarihi |
| `unvan` | `istifa-unvan` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | Mesleki Unvan |
| `ad_soyad` | `istifa-ad_soyad` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | Şantiye Şefi Ad Soyad |
| `tc_deger` | `istifa-tc_deger` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | T.C. Kimlik Numarası |
| `iletisim_deger` | `istifa-iletisim_deger` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | İletişim Telefonu |
| `adres_deger` | `istifa-adres_deger` | 3. Şantiye Şefi ve İletişim Bilgileri | `sefi-iletisim` | Tebligat Adresi |

> **PDF-Only Sabit Etiketler (Formda yok, restore edilmez, AcroForm varsayılanı kalır):**
> 1. `adres_etiket`
> 2. `tc_etiket`
> 3. `iletisim_etiket`

### 1.4 Şantiye Şefi Hizmet Sözleşmesi (`santiye-sefi-sozlesmesi`) (14 Alan)
- **DOM Öneki:** `sozlesme-`

| fieldKey | DOM Input ID | Mevcut JSX Grubu | sectionId | Görünür Alan Başlığı |
|---|---|---|---|---|
| `muteahhit_unvan` | `sozlesme-muteahhit_unvan` | 1. Taraflar | `taraflar` | Yapı Müteahhidi Unvanı |
| `santiye_sefi_ad` | `sozlesme-santiye_sefi_ad` | 1. Taraflar | `taraflar` | Şantiye Şefi Adı Soyadı |
| `il` | `sozlesme-il` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | İl |
| `ilce` | `sozlesme-ilce` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | İlçe |
| `adres` | `sozlesme-adres` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | Açık Adres |
| `mahalle` | `sozlesme-mahalle` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | Mahalle |
| `ada` | `sozlesme-ada` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | Ada |
| `parsel` | `sozlesme-parsel` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | Parsel |
| `yibf` | `sozlesme-yibf` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | YİBF No |
| `pafta` | `sozlesme-pafta` | 2. İşyeri Bilgileri (Madde 2) | `isyeri-bilgileri` | Pafta |
| `ucret` | `sozlesme-ucret` | 3. Ücret ve Sözleşme Tarihi | `ucret-ve-tarih` | Aylık Brüt Ücret |
| `sozlesme_tarihi` | `sozlesme-sozlesme_tarihi` | 3. Ücret ve Sözleşme Tarihi | `ucret-ve-tarih` | Sözleşme Tarihi |
| `santiye_sefi_imza_adi` | `sozlesme-santiye_sefi_imza_adi` | 4. İmza Alanları | `imza-alanlari` | Şantiye Şefi (İmza) |
| `muteahhit_imza_unvan` | `sozlesme-muteahhit_imza_unvan` | 4. İmza Alanları | `imza-alanlari` | Müteahhit (İmza) |

### 1.5 Şantiye Şefi Taahhütnamesi (`santiye-sefi-taahhutnamesi`) (14 Alan)
- **DOM Öneki:** `taahhut-`

| fieldKey | DOM Input ID | Mevcut JSX Grubu | sectionId | Görünür Alan Başlığı |
|---|---|---|---|---|
| `santiye_sefi_ad_soyad` | `taahhut-santiye_sefi_ad_soyad` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | Şantiye Şefi Adı Soyadı |
| `unvan` | `taahhut-unvan` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | Meslek / Unvan |
| `oda_sicil_no` | `taahhut-oda_sicil_no` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | Oda Sicil No |
| `tc_kimlik_no` | `taahhut-tc_kimlik_no` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | T.C. Kimlik No |
| `telefon` | `taahhut-telefon` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | İletişim Telefonu |
| `adres` | `taahhut-adres` | 1. Şantiye Şefi Bilgileri | `sefi-bilgileri` | Tebligat Adresi |
| `ilgili_idare` | `taahhut-ilgili_idare` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | İlgili İdare (Belediye) |
| `il_ilce` | `taahhut-il_ilce` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | İl / İlçe |
| `pafta_ada_parsel` | `taahhut-pafta_ada_parsel` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | Tapu Kaydı (Pafta / Ada / Parsel) |
| `yapi_adresi` | `taahhut-yapi_adresi` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | Yapı Adresi |
| `yapi_sahibi` | `taahhut-yapi_sahibi` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | Yapı Sahibi |
| `yapi_sahibi_adresi` | `taahhut-yapi_sahibi_adresi` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | Yapı Sahibi Adresi |
| `tarih` | `taahhut-tarih` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | Taahhüt Tarihi |
| `unvan_imza` | `taahhut-unvan_imza` | 2. Yapı ve İdare Bilgileri | `yapi-ve-idare` | İmza Alanı Unvanı |

**Toplam Alan Sayısı:** 10 + 8 + 10 + 14 + 14 = **56 düzenlenebilir alan.**

---

## 2. Mevcut Storage Anahtarları ve Alan Sözleşmesi

- **Mevcut Form Görünüm Anahtarı:** `FORM_VIEW_STORAGE_KEY = "belge-studio:form-view:v3"` (`src/lib/belge-studio-form-view.ts`). Kesinlikle değiştirilmeyecek, form görünüm tercihini tutmaya devam edecek.
- **Planlanan Yeni Bölüm Tercih Anahtarı:** `belgeler:ux:sections:v1:${documentId}` (yalnız kapalı ID listesi, PII içermez).
- **Planlanan Otomatik Taslak Anahtarları:**
  - İzin: `belgeler:ux:draft-consent:v1` (PII içermez)
  - Cihaz taslağı (`localStorage`): `belgeler:ux:draft:v1:${documentId}`
  - Sekme taslağı (`sessionStorage`): `belgeler:ux:draft:v1:${documentId}`

---

## 3. Alan Vurgusu Yönü ve Etkileşim Kontratı

- **Mevcut Yön:** **Yalnız Form → PDF.**
  - `useBelgeFieldFocus`, sol form scroll kabına eklenen `onFocusCapture`, `onBlurCapture`, `onKeyDownCapture` olaylarını dinler.
  - Odaklanan input ID'si `fieldKey`'e çözümlenir, `BelgeStudioPdfPreview` içindeki `BelgeStudioFieldFocusLayer` katmanına aktarılır.
  - PDF canvas üzerinde ilgili alan sarı/amber çerçeveyle vurgulanır; gerekiyorsa PDF otomatik olarak o alana kaydırılır (`performReveal`).
  - **Ters yön (PDF → Form) navigasyonu yoktur.** PDF üzerindeki alana tıklandığında `BelgeStudioInlineEditLayer` açılarak doğrudan PDF üzerinde düzenleme başlatılır.

---

## 4. Başlangıç Doğrulama ve Baseline Test Kanıtları

Aşağıdaki komutlar yerel ortamda çalıştırılmış ve sonuçlar kayıt altına alınmıştır:

1. **`npm run check:belgeler-pdf`**
   - **Komut:** `tsx --test tests/belgeler/*.test.ts && tsx scripts/check-belgeler-pdf-visuals.ts`
   - **Sonuç:** `PASS`
   - **Detay:** 26 test suite, 144/144 test başarılı; 6 PDF sayfasının piksel düzeyinde görsel koruma denetimi onaylandı. Süre: ~5.8s.

2. **`npx tsc -p tsconfig.next.json --noEmit --incremental false`**
   - **Sonuç:** `PASS`
   - **Detay:** Sıfır hata, temiz çıkış kodu (0).

3. **`tests/site-audit/belgeler-field-focus.spec.ts` (Chromium 1366, Dev Server: `PLAYWRIGHT_PRODUCTION_SERVER=0`)**
   - **Komut:** `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts --project=chromium-desktop-1366`
   - **Sonuç:** `PASS`
   - **Detay:** 18/18 test başarılı (Beton 10 alan, zoom, toolbar odak koruması, Sözleşme çoklu sayfa geçişi, İstifa PDF-only hariç tutma, Taahhütname satır yoğunluğu, Ruhsat 8 alan ve mobil sekme geçişi). Süre: 1.5m.

4. **`tests/site-audit/belgeler-form-view.spec.ts` (Chromium 1366, Dev Server: `PLAYWRIGHT_PRODUCTION_SERVER=0`)**
   - **Komut:** `$env:PLAYWRIGHT_PRODUCTION_SERVER='0'; npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-form-view.spec.ts --project=chromium-desktop-1366`
   - **Sonuç:** `PASS`
   - **Detay:** 8/8 test başarılı (5 stüdyo form görünümü, reflow/zoom dayanıklılığı, mobil işlemler, tablet görünümü). Süre: 42.9s.
