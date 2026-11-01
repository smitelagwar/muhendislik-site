# ideCAD İkili Proje Dosyası Format Haritası (.ide10 / .ide11)

> **Belge Amacı:** hsynCAD'den sıfırdan üretilecek (.ide10 ve .ide11) dosya yazıcısı (`synthesizeIdeFile`) için tersine mühendislik (REA + Ghidra + binary audit) ile doğrulanmış nihai ikili format kılavuzu.
> **Hedef:** Hiçbir donör dosyaya veya yamaya ihtiyaç duymaksızın saf `CadModel` verisinden açılabilir ideCAD ikili dosyası sentezlemek.

---

## 1. Genel Dosya İskelet Mimarisi

Bir `.ide10` veya `.ide11` dosyası baştan sona sıralı 4 ana bölümden oluşur:

```
+-------------------------------------------------------------+
| 1. BAŞLIK BLOĞU (Header Block - 88 Bayt)                    |
|    - İkili İmza (74B) + Versiyon (4B) + Demo Bayrağı (1B)   |
|    - Toplam Dosya Boyutu (4B) + Payload CRC32 (4B) + 0x00   |
+-------------------------------------------------------------+
| 2. PROJE BİLGİ VE ÖN AYAR BLOĞU (Project Info Block)        |
|    - Proje Adı (Uzunluk + CP1254 String + NUL)              |
|    - Önizleme Görseli / Küçük Resim (cLen + Bitmap/PNG)     |
|    - Yükleme Halleri (13 Temel Yükleme: G, Q, Ex, Ey...)    |
|    - Katman (Layer) Tablosu (Aks, Kolon, Kiriş, Perde...)   |
|    - Çizgi Tipleri (CONTINUOUS, CENTER2, DASHED4...)        |
|    - Malzeme Kütüphanesi (Beton C25/C30, Donatı B420C...)   |
|    - İkincil Proje Bilgileri & Başlık Kartı (Antet)         |
+-------------------------------------------------------------+
| 3. KAT BLOKLARI (Storey Blocks - Kat 0 .. Kat N)            |
|    - Kat Başlığı (Ad, Kot, Kat Yüksekliği, Viewport)        |
|    - Aks Elemanları (primitiveType = 6)                     |
|    - Kolon Elemanları (primitiveType = 4)                   |
|    - Kiriş Elemanları (primitiveType = 5)                   |
|    - Perde Elemanları (primitiveType = 2 veya 17)           |
|    - Döşeme Elemanları (primitiveType = 7)                  |
|    - Döşeme Boşlukları (primitiveType = 13)                 |
|    - Döşeme Kenarları (primitiveType = 45)                  |
|    - Merdivenler (primitiveType = 40)                       |
|    - Kat Sonu Kuyruk Yapısı (Trailer)                       |
+-------------------------------------------------------------+
| 4. KAT SONRASI TABLOLAR VE DOSYA BİTİŞİ (Tail Block)        |
|    - Kat Sonu Mührü                                         |
|    - Mühendis / Firma / Müellif İsim Bloğu                  |
|    - Dosya Sonu (EOF)                                       |
+-------------------------------------------------------------+
```

---

## 2. Bölüm 1: Başlık Bloğu (Header Block - Tam 88 Bayt)

Başlık bloğu dosyanın `0` ile `87` arasındaki ilk 88 baytını kapsar.

| Ofset (Hex) | Ofset (Dec) | Boyut | Veri Tipi | Alan Adı | Değer / Açıklama |
|---|---|---|---|---|---|
| `0x00..0x49` | 0..73 | 74 bayt | ASCII + NUL | `signature` | `"IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0"` |
| `0x4A..0x4D` | 74..77 | 4 bayt | u32 LE | `formatVersion` | `201094` (.ide10) veya `211220` (.ide11) |
| `0x4E` | 78 | 1 bayt | u8 | `encodedFlag` | `0` = Native (standart), `1` = Trial/Demo (Blowfish sayısal şifreli) |
| `0x4F..0x52` | 79..82 | 4 bayt | u32 LE | `fileByteLength` | Dosyanın tam bayt uzunluğu (üretim bittikten sonra mühürlenir) |
| `0x53..0x56` | 83..86 | 4 bayt | u32 LE | `payloadChecksum` | `computeIdePayloadChecksum(bytes, 88)`: 88. bayttan dosya sonuna kadar IEEE 802.3 CRC32 |
| `0x57` | 87 | 1 bayt | u8 | `headerTerminator` | `0x00` |

### CRC32 Hesaplama Algoritması (ideCAD RVA `0x690890`)
- Başlangıç değeri: `0xFFFFFFFF`
- Polinom: `0xEDB88320`
- Kapsam: `bytes.subarray(88)`
- Çıktı: `(~crc) >>> 0`

---

## 3. Bölüm 2: Proje Bilgi ve Önizleme Bloğu (Offset 88 .. previewEnd)

| Ofset | Boyut | Veri Tipi | Alan Adı | Açıklama |
|---|---|---|---|---|
| `88..95` | 8 bayt | u32[2] | `reserved` | `0x00000000, 0x00000000` |
| `96..99` | 4 bayt | u32 LE | `projectNameLen` | Proje adı dizgisinin bayt uzunluğu (`metin.length + 1`, NUL dahil) |
| `100..100+len-1` | `len` | CP1254 | `projectName` | Windows-1254 Türkçe kodlamalı proje adı + `\0` |
| `112 + len` | 4 bayt | u32 LE | `previewLen` (`cLen`)| Proje küçük resim / önizleme bloğu boyutu |
| `116 + len` | `cLen` | bytes | `previewData` | Küçük resim bitmap verisi |
| `previewEnd` | 1 bayt | u8 | `previewTerm` | `0x00` |
| `previewEnd + 1` | 1 bayt | u8 | `demoFlag` | `0` = Ticari lisanslı dosya, `1` = Deneme sürümü (v11'de `previewEnd + 29`) |
| `previewEnd + 2` | 4 bayt | u32 LE | `loadCaseCount` | `13` (Sabit 13 standart yükleme hali) |
| Takip eden | - | Yük halleri | `G, Q, G', Q', Ez(G), Ex, Ey, Ex', Ey', ExB, ExB', EyB, EyB'` | Her biri u32 ID + string |

---

## 4. Bölüm 3: Kat Blokları (Storey Blocks)

Her kat bir başlık ile başlar ve o kata ait tüm yapı elemanlarını sırayla barındırır.

### 4.1 Kat Başlığı (Storey Header)
1. **Kat Adı Uzunluğu:** u32 LE (`name.length + 1`)
2. **Kat Adı:** CP1254 string + `\0` (Örn: `"ZEMİN KAT"`, `"1. KAT"`)
3. **Kat Kotu (`elevation`):** float64 LE (metre cinsinden, örn: `0.0`, `3.5`, `7.0`)
4. **Kat Yüksekliği (`height`):** float64 LE (metre cinsinden, örn: `3.5`)
5. **Kat Özellik Bayrakları:** u32 LE
6. **Viewport Bounds:**
   - v10 için: `elev + height` sonrasında 28 bayt sonra görünüm koordinatları
   - v11 için: +4 bayt ek referans kayması sonrası görünüm koordinatları
   - 4 adet float64 koordinat (minX, minY, maxX, maxY) ikişer kez ardışık yazılır

### 4.2 Ortak Eleman Geometri Kayıt Yapısı (`readNativeGeometry`)
Tüm yapı elemanları (Aks, Kolon, Kiriş, Perde, Döşeme) ortak bir çekirdek geometri gramerini paylaşır:

```
[primitiveType (u32)] -> [count (u32)] -> [count x 16B: (x:f64, y:f64)]
  -> [nativeId (u32)] -> [nativeZ (f64)] -> [width (f64)] -> [layerId (u32)]
  -> [RefList0 (u32 len + u32[])] -> [v11: 16B opaque] -> [rotation (f64)]
  -> [RefList1 (u32 len + u32[])] -> [RefList2 (u32 len + u32[])]
  -> [lateralOffset (f64)]
  -> [BBox (4 x f32: minX, minY, maxX, maxY) - 16 Bayt]
  -> [BBox Tail Padding - 5 Bayt]
  -> [nameLen (u32)] -> [name (CP1254 + \0)]
  -> [color (u32) ~ 1,000,000,000]
```

### 4.3 Eleman Tipleri (`primitiveType`) Değerleri

| Tip Kodu | Eleman Türü | ideCAD Karşılığı | Nokta Sayısı (`count`) | Genişlik (`width`) |
|---|---|---|---|---|
| `2` | Duvar / Mimari Perde | Partition Wall / Shear Wall | 2 nokta (start, end) | Duvar kalınlığı ($m$) |
| `4` | Kolon | Column (Sütun) | 4 nokta (köşeler) veya 1 nokta | Kolon genişliği ($m$) |
| `5` | Kiriş | Beam | 2 nokta (start, end) | Kiriş genişliği ($b_w$) |
| `6` | Aks | Grid Axis | 2 nokta (start, end) | `0.0` |
| `7` | Döşeme | Slab | N nokta (poligon kontur) | Döşeme kalınlığı ($h_f$) |
| `13` | Döşeme Boşluğu | Slab Hole | N nokta (poligon kontur) | `0.0` (RefList1 ile döşemeye bağlı) |
| `17` | Yapısal Perde (Panel) | Structural Shear Wall | 2 nokta (start, end) | Perde kalınlığı ($t_w$) |
| `40` | Merdiven | Stair | 1 nokta (yerleşim noktası) | Merdiven genişliği |
| `45` | Döşeme Kenarı | Slab Edge | 2 nokta (start, end) | `0.0` |
| `128` | Bant Kiriş | Band Beam | 2 nokta (start, end) | Bant genişliği |

---

## 5. Eleman Bazlı Özel Alanlar ve Ofsetler

### 5.1 Kiriş (Beam - `primitiveType: 5`)
- **Geometri:** Başlangıç $(x_1, y_1)$ ve Bitiş $(x_2, y_2)$
- **Genişlik (`width`):** Kiriş gövde genişliği $b_w$ (örn: `0.25` veya `0.30`)
- **Kaçıklık (`lateralOffset`):** Eksen kaçıklığı (0 = ortalı, $b_w$ = sağ/sol kaçık)
- **Kesit Etiketi (Section Label):**
  - İsimden sonra (`nameOffset + nameLen + 1 + offset`): `"25/50"` veya `"30/60"`
  - Kiriş yüksekliği $h$: Kesit etiketinden okunur (`height = label.split("/")[1] / 100`)

### 5.2 Perde / Panel (Wall - `primitiveType: 17`)
- **Geometri:** Başlangıç $(x_1, y_1)$ ve Bitiş $(x_2, y_2)$
- **Kalınlık (`width`):** Perde kalınlığı $t_w$ (örn: `0.25` veya `0.30`)
- **Rotasyon (`rotation`):** Perdenin plan açısı ($0^\circ$ veya $90^\circ$)
- **Plan Kesit Etiketi:** İsimden sonra plan kesit etiketi (Örn: `"P43 255/25"`)
- **Yükseklik:** Kat yüksekliğinden ($H_{kat}$) veya `readNativeWallHeight` kaydından

### 5.3 Döşeme (Slab - `primitiveType: 7`)
- **Geometri:** Poligon sınır noktaları (saat yönü veya tersi sıralı $N$ köşe)
- **Kalınlık (`thickness`):** `width` alanında saklanır (örn: `0.15` veya `0.20`)
- **Boşluk İlişkileri:** `RefList1` içinde ilişkili `primitiveType: 13` (delik) elemanlarının `nativeId` listesi
- **Yük Kayıtları (`readSlabPlanLoads`):**
  - İsim sonu $+ 481$ (v10) veya $+ 485$ (v11): Hareketli yük $Q$ (float64, $tf/m^2$, örn: `0.200` அல்லது `0.350`)
  - İsim sonu $+ 497$ (v10) veya $+ 501$ (v11): Sabit yük $G$ (float64, $tf/m^2$, örn: `0.350` veya `0.500`)
- **Hesap Aksları (`readSlabDesignAxes`):**
  - İsim sonu $+ 776$ (v10) veya $+ 780$ (v11): 1. doğrultu hesap aksı (normalize doğru denklemi $ax + by + d = 0$ + 4 nokta)

### 5.4 Kolon (Column - `primitiveType: 4`)
- **Geometri:** 4 köşe noktası poligonu (örneğin $50\times 50\text{ cm}$ için 4 köşe koordinatı)
- **Alt Kot:** `floor.elevation + nativeZ`
- **Üst Kot:** `floor.elevation + floor.height`
- **Yükseklik:** `floor.height`

---

## 6. Proje Bitiş Bloğu (Tail Block - Mühür ve Antet)

Dosyanın son 10 KB'lık bölgesinde:
1. Katlar bittikten sonra kat sonu bayrağı (`0xFFFFFFFF`)
2. Kat sonrası çizim paftaları, detaylar ve antet bilgileri
3. **Müellif ve Statik Mühendis Başlık Kartı:**
   - Proje Adı (Örn: `"7 Katlı Plaza ve Ticaret Merkezi"`)
   - Mühendis Unvanı ve Adı (CP1254 string)
   - Oda Sicil No / Şehir / Tarih

---

## 7. v10 vs v11 Farklar Matrisi

| Özellik | ideCAD v10 | ideCAD v11 |
|---|---|---|
| `formatVersion` | `201094` (`0x00031176`) | `211220` (`0x00033914`) |
| Storey Viewport Kayması | 0 bayt | +4 bayt ek u32 |
| Geometri RefList0 Sonu | Doğrudan rotation (f64) | 16 bayt opak u32[4] ardından rotation |
| Döşeme Yük Ofseti | `p + 481` ($Q$), `p + 497` ($G$) | `p + 485` ($Q$), `p + 501` ($G$) |
| Döşeme Hesap Aksı Ofseti | `p + 776` | `p + 780` |
| Demo Bayrağı Konumu | `previewEnd + 1` | `previewEnd + 29` (sonrasında `0x000005ce`) |
| Sayısal Kodlama (Trial) | Yok (Native) | Trial sürümünde Blowfish ile kodlu |

---

## 8. Sentezleme / Yazma Algoritması (`synthesizeIdeFile`)

1. **Katman ve Stil Şablonunu Başlat:**
   - Header (88 bayt): imza, `formatVersion`, `encodedFlag = 0`, geçici uzunluk ve CRC.
   - Proje adı (ör. `"7 Katlı Plaza ve Ticaret Merkezi"`).
   - Standart 13 yükleme hali tanımları.
   - Aks, kolon, kiriş, perde, döşeme katmanları.
2. **Katları ve Elemanları Sırayla Ekle:**
   - Her kat için kat başlığını yaz (`name`, `elevation`, `height`, `viewport`).
   - O kata ait aksları (`primitiveType: 6`) ekle.
   - O kata ait kolonları (`primitiveType: 4`) ekle (4 nokta + boyutlar).
   - O kata ait kirişleri (`primitiveType: 5`) ekle (2 nokta + genişlik + kesit etiketi).
   - O kata ait perdeleri (`primitiveType: 17`) ekle (2 nokta + kalınlık + plan etiketi).
   - O kata ait döşemeleri (`primitiveType: 7`) ekle ($N$ nokta + kalınlık + $G/Q$ yükleri).
3. **Kuyruk ve Antet Bloğunu Ekle:**
   - Proje başlık kartını yaz.
4. **Mühürle (`sealIdeCarrierHeader`):**
   - Toplam bayt boyutunu offset `79`'a yaz.
   - 88. bayttan dosya sonuna kadar olan verinin CRC32'sini hesapla ve offset `83`'e yaz.
