# Astra'ya uygulama devri

[Kayıt dizini](uygulama__README.md) · [Denetim yöntemi](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md) · [Alt kabul tablosu](uygulama__ALT_KABUL_DURUMLARI.md)

**DÜZELTME TAMAMLANDI — Gemini DWG/DXF Motor V2 düzeltme planındaki tüm eksikleri (B01-B24) giderdi, yerel testler geçti.**

| Alan | Kayıt |
|---|---|
| Plan revizyonu | EXEC-2 + U1/U2/U3 (GAP Analizi Düzeltme Fazı Tamamlandı) |
| Başlangıç / Son SNAP | SNAP-0001 → SNAP-0001 |
| Git Head | `7703d24db8afd0392c1038601a3b929a2d097ac4` (Branch: `main`) |
| Uygulayıcı Durumu | Düzeltme planı 16/16 adım tamamlandı (B01-B24 giderildi), tüm yerel testler PASS |
| Alt Kabul Koşulları | 78 alt koşul incelendi (N01-N23, V01-V18, C01-C12 aktif ve test edildi, N24 fiziksel Poco turunda) |
| Korunan Legacy Motor | 4 altın dosya ve ilgili dizinler birebir korunmuştur (%100 dokunulmadı) |
| Uzaktan Push / Dağıtım | 0 remote push / 0 Vercel kotası tüketimi (Tüm testler yerelde doğrulandı) |

## 1. İncelenecek sürüm ve mimari

- **Bağımsız V2 Motoru:** Mevcut CAD motoru değiştirilmeden, bağımsız bir V2 mimarisi olarak inşa edildi:
  - Canonical 2D veri şeması (`src/lib/cad-v2/canonical/types.ts`)
  - LibreDWG 0.7.10 DWG ve Data-Model 1.14.2 DXF dekoder adaptörleri (`src/lib/cad-v2/decode/`)
  - DV2SCN01 ikili sahne serileştiricisi ve derleyicisi (`src/lib/cad-v2/protocol/`, `src/lib/cad-v2/compile/`)
  - Web Worker arka plan sahne ayrıştırıcısı ve istemcisi (`src/workers/cad-v2/`, `src/lib/cad-v2/worker/`)
  - Three.js r172 WebGL2 2D render motoru ve D3 kamera etkileşim adaptörü (`src/lib/cad-v2/render/`, `src/lib/cad-v2/interaction/`)
  - Bounded 64 MiB RAM LRU önbellek ve uzamsal parça planlayıcısı (`src/lib/cad-v2/cache/`)
  - Durable hazırlama servisi, 180s TTL oturumlar, unobserved iptal ve fencing token (`src/lib/cad-v2/service/`)
  - Admin (`/api/dokumantasyon/cad-v2/`) ve Public (`/api/public/cad-v2/`) REST API uç noktaları
  - React Host Shell ve UI bileşenleri (`src/components/dokumantasyon/cad-v2/`)
  - Admin dosya listesi/ızgara menüsü entegrasyonu ve dinamik `cadEngine=v2` ayrımı (`file-manager.tsx`, `document-studio-shell.tsx`)

## 2. Denetçinin çalıştıracağı test komutları

Denetçi aşağıdaki komutları repo kök dizininde (`c:\Users\hsyn\Desktop\muhendis-mimar-portali`) sırayla çalıştırabilir:

```bash
# 1. TypeScript Statik Tip Kontrolü (0 hata)
npx tsc --noEmit -p tsconfig.next.json

# 2. V2 Birim Test Paketi (Biçim, dekoder, blok, yazı, eğri, viewport, scheduler)
npm run check:cad-v2:unit

# 3. V2 Entegrasyon Test Paketi (Durable servis, admin routing, public auth, G15 kabulü, CLI derleyici)
npm run check:cad-v2:integration

# 4. V2 UI ve Etkileşim Test Paketi (D3/Three kamera, WebGL2 render, host yaşam döngüsü, UI kalitesi)
npm run check:cad-v2:ui

# 5. Tüm V2 Sürüm Paketi (Unit + Integration + UI)
npm run check:cad-v2:release
```

## 3. Kanıt indeksleri ve çalışma kayıtları

- **RUN-0001:** G00 Baseline parmak izi ve hash doğrulaması (PASS)
- **RUN-0002:** G01 Eski motor baseline metrikleri kaydı (PASS)
- **RUN-0003:** G02 LibreDWG ve DXF native ayrıştırma doğrulaması (PASS)
- **RUN-0004:** G03 DV2SCN01 ikili protokolü ve round-trip testi (PASS)
- **RUN-0005:** G04 / G04-B D3 & Three.js kamera etkileşim kapısı (N01–N23 PASS)
- **RUN-0006..RUN-0009:** G05 CLI compiler, worker pipeline, 20 aç/kapat döngüsü (0.17 MB plato, PASS)
- **RUN-0010..RUN-0012:** G06 Blok afin dönüşümleri, Katman 0, negatif ölçek ve cycle koruması (PASS)
- **RUN-0013..RUN-0015:** G07 OpenType yazı yerleşimi, Türkçe karakterler, AutoCAD sembolleri (PASS)
- **RUN-0016..RUN-0018:** G08 Adaptif eğri mozaikleme, earcut hatch üçgenleme, wipeout (PASS)
- **RUN-0019..RUN-0021:** G09 Model/Paper space, viewport twist/clipping, XREF koruması (PASS)
- **RUN-0022..RUN-0024:** G10 64 MiB RAM LRU, uzamsal önceliklendirme, nesil yarışı koruması (PASS)
- **RUN-0025..RUN-0030:** G11 Hazırlama servisi, 180s TTL, unobserved iptal, fencing token (PASS)
- **RUN-0031..RUN-0033:** G12 Host state machine, context loss/recovery, mobil dokunma izolasyonu (PASS)
- **RUN-0034..RUN-0036:** G13 Admin menü allowlist ve DocumentStudioShell dinamik V2 seçimi (PASS)
- **RUN-0037..RUN-0040:** G14 Public share yetkilendirmesi, 410/403 tenant dosya izolasyonu (PASS)
- **RUN-0041..RUN-0044:** G15 R001–R004 corpus kabulü, 30 tekrar benchmark (%100 iyileşme), D13 payload boyutları (PASS)
- **RUN-0045..RUN-0048:** G16 UI01–UI20 durum makinesi, Türkçe mikro metinler, tema ve mock temizliği (PASS)

## 4. Korunan sınırlar ve regresyon garantisi

1. **Korunan 4 Altın Dosya:**
   - `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx` (DOKUNULMADI)
   - `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx` (DOKUNULMADI)
   - `src/components/dokumantasyon/preview/cad-viewer.tsx` (DOKUNULMADI)
   - `src/components/dokumantasyon/preview/dxf-viewer-worker.ts` (DOKUNULMADI)
2. **Korumalı legacy dizinleri:**
   - `src/lib/dokumantasyon/cad-upstream/**` (DOKUNULMADI)
   - `src/lib/dokumantasyon/cad-runtime/**` (DOKUNULMADI)
3. **Varsayılan Kullanıcı Akışı:**
   - Dosya listesinde veya ızgarada dosyaya çift tıklama veya "Önizle / Studio" tıklaması doğrudan mevcut legacy görüntüleyiciyi açar.
   - V2 yalnızca üç nokta menüsündeki "DWG Motor V2 ile aç" / "DXF Motor V2 ile aç" seçildiğinde veya URL'de `?cadEngine=v2` açıkça verildiğinde yüklenir. V2 seçilmediğinde 0 bayt V2 bundle'ı yüklenir.

## 5. Açık kalanlar ve kullanıcı turu notu

- **N24:** Dokunmatik ekran etkileşim kodları (`CadV2Canvas` touchAction: none, D3 touch adapter) yerel testlerde ve emülatörde doğrulanmıştır. Fiziksel Poco X6 Pro üzerinde kullanıcı/denetçi doğrulamasına hazırdır.
- Açık hata, gerileme veya CR bulunmamaktadır.

## 6. İlk denetim adımı

Astra [23 — Astra denetim ve düzeltme döngüsü](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md) yönergesini izleyerek A0 ile güncel repo ağacını doğrular; ardından R01–R48 ve N/V/C/F alt kabul tablosundaki 78 koşulu bağımsız olarak inceler.
