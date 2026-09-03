# CAD AutoCAD Parite ve Sıfır-Regresyon Baseline Raporu (Aşama 1)

> **Tarih:** 3 Eylül 2026  
> **Uygulayıcı:** Gemini 3.8 Flash (High)  
> **Repo:** `smitelagwar/muhendislik-site`  
> **Hedef:** Kullanıcının AutoCAD ve web görüntüleyicide açtığı çizimlerde (özellikle font, semantik ve görsel parite) sıfır regresyon ve AutoCAD ile tam uyum sağlamak.

---

## 1. Git Güvenlik Baseline'ı

- **Başlangıç Commit SHA:** `afbc121923f2de1313801f884f428535334a40cf`
- **Branch:** `main`
- **Çalışma Ağacı Durumu:** Temiz (`git status --short` boş)
- **Tarih Damgası:** 2026-09-03T11:00:00+03:00

---

## 2. Sabit Paket Sürümleri

`package.json` üzerinden doğrulanmış kesin sürümler:

| Paket Adı | Belirtilen / Yüklü Sürüm | Rol |
|---|---|---|
| `@mlightcad/cad-simple-viewer` | `1.6.2` | Birincil DXF/DWG canvas renderer |
| `@mlightcad/data-model` | `1.14.2` | CAD varlık veri modeli ve katman yönetimi |
| `@mlightcad/libredwg-converter` | `3.14.2` | LibreDWG WebWorker / WASM dönüştürücü |
| `dxf-viewer` | `^1.0.48` | Fallback terminal motoru |

*Kural: Bu çalışma boyunca paket sürümleri değiştirilmeyecek, node_modules içine doğrudan müdahale edilmeyecektir.*

---

## 3. Mevcut Font Asset Listesi ve Bütünlük Hash'leri

`public/cad-upstream/fonts/` dizinindeki mevcut dosyalar:

| Dosya Yolu | Boyut (Bayt) | SHA-256 Hash |
|---|---|---|
| `public/cad-upstream/fonts/Arial-Regular.ttf` | 1.036.584 | `c9b76220a5be42ead4733611e417cd65c5fd8aeaa33eb56576ac378a37d130a1` |
| `public/cad-upstream/fonts/Arial-Bold.ttf` | 980.756 | `766f06ac8761f82f25d032a220e89438f6064591af9915061f20b949efdedf69` |
| `public/cad-upstream/fonts/fonts.json` | 501 | `a1e30ff1b56f0bec7e9229644762976ca7e71dcb53eff2f7a0377ff2148dafe5` |

### Mevcut `fonts.json` İçeriği
```json
[
  {
    "file": "Arial-Regular.ttf",
    "name": [
      "arial",
      "arial-regular",
      "arial.ttf",
      "standard",
      "txt",
      "txt.shx",
      "romans",
      "romans.shx",
      "simplex",
      "simplex.shx",
      "isocpeur",
      "isocpeur.ttf",
      "times",
      "times new roman",
      "calibri"
    ],
    "type": "mesh"
  },
  {
    "file": "Arial-Bold.ttf",
    "name": [
      "arial-bold",
      "arial-bold.ttf",
      "arialb.ttf"
    ],
    "type": "mesh"
  }
]
```

### Kritik Tespitler
1. `fonts.json` içinde `Arial-Bold.ttf` yalnızca `["arial-bold", "arial-bold.ttf", "arialb.ttf"]` isimlerini içermektedir. Çizimlerin yaygın olarak referans verdiği `arialbd.ttf` veya `ARIAL_BOLD` **bu listede yoktur**.
2. `src/lib/dokumantasyon/cad-upstream/adapter.ts` içinde `FontManager.setFontMapping()` çağrısında `arialbd.ttf`, `arial-bold` veya `ARIAL_BOLD` tanımlı değildir.
3. `adapter.ts` içinde başlatma sırasında yalnızca `Arial-Regular.ttf` asenkron `fetch()` edilip `cacheFont` çağrılmaktadır; `Arial-Bold.ttf` hiçbir zaman önceden yüklenmemektedir.
4. Bu sebeple `ARIAL_BOLD` stilini kullanan çizimler MLightCAD tarafından bulunamamakta, içi dolu glif yerine tel kafes / kontur fallback moduna düşmektedir.

---

## 4. Hedef Test Çizimi ve Referans Görseller

- **Orijinal Çizim Adı:** `kalip_plani_zeminkat.dxf` (364.2 KB)
- **Yerel Test Kopyası:** `C:\Users\hsyn\Downloads\ab620c5f-24a6-41ef-947e-13aca588dff7.dxf`
- **Dosya Boyutu:** 372.927 bayt
- **SHA-256 Hash:** `b0c5454eb6a39a9508e9d7fd1a93a746b2764dfba789706567e0055fefc8422f`
- **Canlı Sistemdeki URL:** `https://muhendislik-site.vercel.app/dokumantasyon/dosya/7d446730-1a85-4e61-bf20-35e1946d1569`

### Referans Görselleri

| Görsel Türü | Dosya Yolu | Açıklama |
|---|---|---|
| **AutoCAD Genel** | `C:\Users\hsyn\.gemini\antigravity\brain\925e9267-d03f-4ea9-b4c8-f8886736bbea\.user_uploaded\media_1788420879655.png` | AutoCAD LT 2017 tam kalıp planı genel görünümü |
| **AutoCAD Zoom** | `C:\Users\hsyn\.gemini\antigravity\brain\925e9267-d03f-4ea9-b4c8-f8886736bbea\.user_uploaded\media_1788420880660.png` | `Ü(1Φ14)`, `Ü(2Φ14)`, `KZ01/22`, `DZ01 d=15` detay yakınlaştırması |
| **Web Viewer Genel** | `C:\Users\hsyn\.gemini\antigravity\brain\925e9267-d03f-4ea9-b4c8-f8886736bbea\.user_uploaded\media_1788420881969.png` | Web viewer mevcut hatalı genel görünümü |
| **Web Viewer Zoom** | `C:\Users\hsyn\.gemini\antigravity\brain\925e9267-d03f-4ea9-b4c8-f8886736bbea\.user_uploaded\media_1788420883160.png` | `Ü(2Φ14)` ve çevre donatı metinlerinin tel kafes / kontur görünümü |

---

## 5. Hedef Çizimin STYLE ve Metin Analizi (Audit Raporu)

`scripts/audit-cad-font-fidelity.mjs` tarafından üretilen denetim çıktısı:

```json
{
  "acadVersion": "AC1032",
  "dwgCodePage": "ANSI_1252",
  "styles": [
    {
      "styleName": "Standard",
      "primaryFont": "txt",
      "bigFont": null,
      "widthFactor": 1,
      "obliqueAngle": 0,
      "entityCount": 0,
      "entityTypes": [],
      "samples": []
    },
    {
      "styleName": "ARIAL_BOLD",
      "primaryFont": "arialbd.ttf",
      "bigFont": null,
      "widthFactor": 1,
      "obliqueAngle": 0,
      "entityCount": 378,
      "entityTypes": [
        "TEXT",
        "MTEXT"
      ],
      "samples": [
        "PZ23 150/25",
        "PZ30 150/25",
        "PZ34 150/25",
        "PZ38 150/25",
        "PZ41 150/25",
        "PZ36 150/25",
        "PZ27 150/25",
        "PZ28 150/25",
        "PZ32 150/25",
        "PZ37 150/25"
      ]
    }
  ],
  "specialTokens": [
    "Φ",
    "Turkish"
  ],
  "missingOrUnknownStyles": []
}
```

---

## 6. Hedef `Ü(1Φ14)` Varlığının Detaylı Sınıflandırması

| Parametre | Tespit Edilen Gerçek Değer | Analiz / Çıkarım |
|---|---|---|
| **Ham Bayt Dizisi** | `0xC3 0x9C 0x28 0x31 0xCE 0xA6 0x31 0x34 0x29` | UTF-8 kodlamalı bayt dizisi |
| **Unicode Kod Noktaları** | `\u00dc \u0028 \u0031 \u03a6 \u0031 \u0034 \u0029` | Tam Unicode formatı |
| **`Ü` Karakteri** | `\u00dc` (LATIN CAPITAL LETTER U WITH DIAERESIS) | Gerçek Unicode `Ü`, bozuk bayt veya escape değil |
| **`Φ` Karakteri** | `\u03a6` (GREEK CAPITAL LETTER PHI) | Gerçek Yunan alfabesi Phi karakteri (`%%c` veya `Ø` \u00d8 değil) |
| **Varlık Türü** | `TEXT` | `AcDbText` (MTEXT, ATTRIB veya DIMENSION değil) |
| **Katman (Layer)** | `KIRIS_ILAVE_DONATI` | Kırmızı renkli kiriş ilave donatı katmanı |
| **Yazı Yüksekliği (Height)** | `25.0` CAD birimi | Okunaklı standart pafta donatı yüksekliği |
| **Genişlik Faktörü (Width)** | `1.0` | Standart ölçekli glif genişliği |
| **Rotasyon Açısı** | `90.0°` (Dikey) / `0.0°` (Yatay) | Dikey yazılarda tam 90°, yatay yazılarda 0° |
| **Hizalama (Justification)** | Yatay: `1` (Center), Dikey: `2` (Middle) | Metin ortalanmış durumdadır |
| **Yerleştirme Noktası (Insert Point)** | `(57676.89, 18366.58, 0.0)` | WCS düzleminde tanımlı |
| **Hizalama Noktası (Align Point)** | `(57676.89, 18366.58, 0.0)` | Group 11/21/31 ile birebir örtüşüyor |
| **Extrusion / OCS** | Yok (Varsayılan `[0, 0, 1]`) | 2D düzlemde standart WCS yönü |
| **Kullanılan Stil** | `ARIAL_BOLD` | TABLES tablosunda tanımlı |
| **Stilin Font Dosyası** | `arialbd.ttf` | TrueType font dosyası referansı |

---

## 7. Web Viewer ve Upstream Motor Doğrulaması

1. **Çalışan Motor:**
   - `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx` incelendiğinde, `.dxf` dosyaları için varsayılan state `engine = "upstream"` olarak ayarlanmıştır.
   - DOM'da `data-cad-runtime="orchestrator"` ve `data-cad-engine="upstream"` öznitelikleri bulunur.
   - Sadece bir istisna fırlatıldığında `legacy` motora geçilmektedir; dolayısıyla mevcut görüntü hatası upstream motorun doğal çıktısıdır.
2. **Font İstekleri ve Önbellek:**
   - Network sekmesinde `/cad-upstream/fonts/Arial-Regular.ttf` dosyası çekilmekte, ancak `Arial-Bold.ttf` veya `arialbd.ttf` talep edilmemektedir.
   - MLightCAD fontları tarayıcının IndexedDB (`cad_font_cache`) alanında saklar. Test sürecinde eski önbelleğin maskelemesini önlemek için IndexedDB temizliği zorunludur.

---

## 8. AutoCAD Golden Referans Bölgeleri

1. **Bölge 1 — Yatay Anotasyon:**
   - Koordinat: `(59406.39, 16491.08)` ve `(59801.39, 18280.08)`
   - Metin: `Ü(1Φ14)` (Rotation: 0°)
2. **Bölge 2 — Dikey Anotasyon:**
   - Koordinat: `(57676.89, 18366.58)` ve `(60116.89, 16281.58)`
   - Metin: `Ü(1Φ14)` ve `Ü(2Φ14)` (Rotation: 90°)
3. **Bölge 3 — Callout ve Etiket Metinleri:**
   - Daire içi döşeme metinleri: `DZ01 d=15`, `DZ02 d=15`
   - Kiriş/kolon etiketleri: `KZ01 / 22`, `PZ33 150/25`
4. **Bölge 4 — Tam Plan Genel Görünümü:**
   - Tüm paftanın fit-to-view oranları, katman renkleri ve genel okunabilirliği.

---

## 9. Regresyon Test Korpusu

Bu çalışma sırasında parite ve sıfır-regresyon denetimi için kullanılacak çizim seti:

### DXF Korpusu:
1. `tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf` (Geometri, poligon, ölçüm testleri)
2. `tests/fixtures/cad-preview-v2/text-turkish-unicode.dxf` (Türkçe Unicode karakterler ve TXT font)
3. `tests/fixtures/dxf/stage3-text-mtext.dxf` (TEXT, MTEXT, SHXSTYLE / romans.shx ve Arial.ttf)
4. `eklediklerim/ornek_dosyalar/SÜHEYLA KARA STATİK (HAFİF).dxf` (50.000+ varlık, 27 stil, SHX ve TTF karışık gerçek üretim paftası)

### DWG Korpusu:
1. `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg`
2. `eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg`
3. `eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg`

---

## 10. STOP GATE 1 Doğrulama Kontrol Listesi

- [x] Başlangıç commit SHA kaydedildi (`afbc121923f2de1313801f884f428535334a40cf`).
- [x] Upstream motor doğrulaması yapıldı (`data-cad-engine="upstream"`).
- [x] Hedef çizimin STYLE/fontFile/bigFont listesi çıkarıldı (`Standard: txt`, `ARIAL_BOLD: arialbd.ttf`).
- [x] `Ü(1Φ14)` gerçek entity türü (`TEXT`), raw UTF-8 baytları ve tam Unicode kodları bulundu.
- [x] AutoCAD golden referans bölgeleri tanımlandı (4 kritik bölge).
- [x] Mevcut sistemdeki `arialbd.ttf` çözümlenememe / tel kafes fallback nedeni kanıtlandı.
- [x] En az 4 ek DXF ve 3 ek DWG regresyon örneği belirlendi.
- [x] Aşama 1 boyunca hiçbir üretim kodu veya font mapping değiştirilmedi.

**Sonuç: STOP GATE 1 BAŞARIYLA GEÇİLDİ. AŞAMA 2'YE GEÇİŞE HAZIR.**
