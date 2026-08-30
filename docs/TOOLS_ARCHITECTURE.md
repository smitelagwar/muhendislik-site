# Mühendislik Araçları Mimarisi (TOOLS_ARCHITECTURE)

> **Proje:** `muhendislik-site`  
> **Katalog:** `/kategori/araclar`  
> **Hedef:** 30/30 Gerçek Çalışan, Doğrulanmış ve Sıfır Placeholder'lı Mühendislik Araçları Ekosistemi

---

## 1. Temel Mimari İlkeler

### 1.1 UI ve Hesap Motoru Ayrımı (Pure Engine Principle)
Mühendislik hesapları doğrudan React bileşeni içerisinde veya render döngüsünde serbest kod olarak çalıştırılamaz.

- **Yanlış:** `const capacity = b * d * fcd * 0.85;` (JSX içinde)
- **Doğru:** `const result = calculateBeamCapacity(input);` (Ayrık, saf fonksiyon)

Her hesap motoru:
1. Yan etkisiz (pure, side-effect free) ve deterministik olmalıdır.
2. React ve DOM bağımlılığı taşımamalıdır.
3. Node.js ve browser ortamlarında bağımsız test edilebilir (`tests/` veya `scripts/`) olmalıdır.
4. Geçersiz girdilerde asla `NaN`, `Infinity` veya sessiz `0` üretmemeli; açıkça `null` veya tip güvenli hata objesi dönmelidir.

### 1.2 Birim Sözleşmesi (Unit Contract)
Her mühendislik büyüklüğü için sistem genelinde kanonik iç birimler (canonical internal units) tanımlıdır:

```text
Kullanıcı Arayüzü (cm, mm, m, tf, kN, kNm, MPa, °C, °)
       ↓ (Normalizasyon / Dönüşüm)
Kanonik İç Birimler (Uzunluk: mm, Kuvvet: N veya kN, Gerilme: MPa, Açı: radyan veya derece)
       ↓ (Deterministik Hesaplama Motoru)
Kanonik Sonuçlar
       ↓ (Biçimlendirme / tr-TR formatı)
Kullanıcı Arayüzü / Sonuç Kartı / PDF Raporu
```

### 1.3 Sonuç Modeli Sözleşmesi (Result Contract)
Mühendislik sonuçları sadece tek bir ham sayıdan ibaret olamaz. Her sonuç objesi şu bilgileri yapısal olarak taşır:

```typescript
export interface EngineeringResult<TDetails = Record<string, unknown>> {
  primaryValue: number | string;
  unit: string;
  status: "ok" | "warn" | "fail";
  statusLabel: string;
  utilizationRatio?: number; // Kapasite kullanım oranı (0.00 - 1.00+)
  governingCriterion?: string; // Belirleyici kriter (örn. TS 500 Denklem 8.1)
  details: TDetails;
  warnings: string[];
  assumptions: string[];
}
```

---

## 2. Dizin ve Katman Mimarisi

```text
src/
├── app/
│   └── kategori/
│       └── araclar/
│           ├── [slug]/             # Registry destekli dinamik rota fallback
│           ├── donati-hesabi/      # Dedicated statik rotalar
│           ├── kolon-on-boyutlandirma/
│           ├── ...
│           └── page.tsx            # Araçlar Hub sayfası (30 kartlık katalog)
├── components/
│   ├── ...-calculator.tsx          # Araç UI bileşenleri (Form, reaktif durum, grafikler)
│   ├── tool-icon.tsx               # 30 araç için optimize edilmiş SVG ikonları
│   └── tool-watermarks.tsx         # Görsel mühendislik filigranları
└── lib/
    ├── tools-data.ts               # 30 araçlık ana katalog metadata kaynağı
    ├── concrete-tools/             # Betonarme hesap motorları (TS 500 / EC2)
    │   ├── column.ts               # Kolon ön boyut & kapasite (Protected)
    │   ├── beam.ts                 # Kiriş eğilme & kesme (Protected)
    │   ├── slab.ts                 # Döşeme kalınlığı & donatısı (Protected)
    │   ├── cover.ts                # Pas payı (Protected)
    │   ├── punching.ts             # Zımbalama motoru
    │   ├── shear-stirrup.ts        # Kiriş kesme & etriye motoru
    │   └── splice.ts               # Kenetlenme ve bindirme boyu motoru
    ├── engineering/
    │   ├── tbdy2018/               # Deprem motorları (Taban kesme, periyot, spektrum, drift, düzensizlik)
    │   ├── geotech/                # Geoteknik motorları (Zemin sınıfı, radye temel, iksa, şev stabilitesi)
    │   ├── steel-timber/           # Çelik ve ahşap motorları (Profil seçimi, birleşim, ahşap kesit)
    │   └── quantity/               # Metraj ve yaklaşık sarfiyat motorları (Beton, hafriyat, demir, kalıp, duvar, sıva, çatı, seramik)
    ├── ts825/                      # Isı yalıtım motoru (TS 825:2024)
    ├── imar/                       # İmar hesaplayıcı motoru
    └── rebar-calculations.ts       # Donatı alanı ve metraj hesapları
```

---

## 3. Rota ve Server/Client Sınırları

1. **SEO ve Server Component Güvenliği:**
   - `page.tsx` dosyaları varsayılan olarak **Server Component**'tir.
   - `generateMetadata` ve `SoftwareApplicationJsonLd` sunucu tarafında `tools-data.ts` ve `tool-page-seo.ts` üzerinden hatasız derlenir.
   - İstemci bileşenleri (`"use client"`) sadece etkileşimli hesaplayıcı arayüzünü kapsar.

2. **Dedicated vs. Dynamic Route Stratejisi:**
   - Mevcut çalışan dedicated statik rotalar Next.js tarafından öncelikli çözülür ve stabilite için korunur.
   - Yeni araçlar ister dedicated rota ister merkezi registry üzerinden render edilsin, kullanıcı deneyimi ve URL yapısı (`/kategori/araclar/[tool-id]`) tamamen özdeştir.

---

## 4. Korumalı Hesaplayıcılar Sözleşmesi (Protected Calculators)

`PROJECT.md` gereğince aşağıdaki 5 hesaplayıcının mevcut formülleri dondurulmuştur:
1. **Kolon Ön Boyutlandırma:** `calculateColumnPreliminarySizing`, `calculateColumnCapacity`
2. **Kiriş Kesiti:** `calculateBeamFlexure`, `calculateBeamShear`
3. **Döşeme Kalınlığı:** `calculateSlabThickness`, `calculateSlabMinimumRebar`
4. **Pas Payı:** `calculateConcreteCover`
5. **Kalıp Söküm Süresi:** `KalipSokumHesapPage` hesap algoritması

Bu motorlar üzerinde yapılacak herhangi bir düzenleme yalnız arayüz, tip güvenliği ve validation iyileştirmesiyle sınırlıdır; `scripts/check-tools-regression-baseline.ts` test paketinde tanımlanan sayısal sonuçlar asla değiştirilemez.

---

## 5. Canlılık Değişmezliği (Live Invariant)

Sistemde hiçbir araç için sahte `"live"` statüsü verilemez. Bir araç ancak ve ancak:
1. Kataloğa kayıtlıysa,
2. Rotası 200 OK ile render oluyorsa,
3. Saf hesap motoru yazılmış ve doğrulanmışsa,
4. Normatif kaynağı `TOOLS_SOURCE_LEDGER.md` kütüğünde kayıtlıysa,
5. Unit ve regression testleri geçiyorsa,
6. Kullanıcıya hiçbir placeholder / yapım aşamasında uyarısı göstermiyorsa

`live` ve `verified` olarak kabul edilir.
