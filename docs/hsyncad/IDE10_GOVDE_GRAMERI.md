# IDE10 Gövde Grameri — v10 (.ide10) Kayıt/Alt-Akış Haritası

**Görev:** F2/T-F2.6 (gramer-mimarı sentezi, 19 Kasım 2026) · **Makine-okunur ikiz:** [`src/lib/hsyncad/ide-import/ide10-grammar.json`](../../src/lib/hsyncad/ide-import/ide10-grammar.json) (şema sürümü **1.0.2** — v1.0.1: T-F2.7b savcı/critic keskinlik düzeltmeleri · v1.0.2: T-F2.7c G3 bağlamaları)
**Tüketici:** T-F3.3 gövde transcoder'ı, T-F4.1 ters yükseltici, T-F5.1 encoded v11 okuma. Şemadaki her kural **KANIT** ya da **VARSAYIM** etiketlidir; **F3 üretim girdisinde VARSAYIM kullanımı yasaktır** (T-F2.7 savcı turu denetler). v1.0.1'den itibaren mekanik yaptırım: T-F3.3 üretim yükleyicisi `assumption:true` satırında **üretim yolunda hard-fail eder ve reddedilenleri loglar**; test/analitik yolda yalnız warning verir (şema `meta.tuketiciSozlesme`).

Bu doküman dört F2 kulvarının sentezidir: M0 diferansiyel deneyi (T-F2.2), M1–M6 tek değişkenli mutasyonlar (T-F2.3/T-F2.3b), 140 MB korpus byte-map (T-F2.4) ve decompile çaprazları (T-F2.5). Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad_idecad_uzanti_optimizasyon\evidence\orkestrasyon\` (bölüm §19'da tam dizin).

---

## 0. Adres/SHA çapası kuralı (t25 yan bulgusu — OKUNMADAN GEÇME)

Kurulu `ideCAD_Statik_11_Deneme.exe` **30 Ekim 2026 sonrasında güncellendi**: eski REA kayıtlarının kaynağı aynı kurulum yolu ama SHA-256 `a4dcabe8…` (30 Ekim); güncel SHA-256 `350d5a581417dec9cddac52b66e1a4b60ecdce227e70eb93cb909b6f660162f4`.

- **Değişmeyen bölge:** `0x14098xxxx` (belge yazıcı/okuyucu/fabrika) — 5 hazır decompile taze Ghidra 12.1.4 çıktısıyla **bayt-özdeş** doğrulandı (`fc /b`, fark yok). Bu bölgedeki satır atıfları günceldir.
- **Kaymış bölge:** `0x140b8eXXX` (eski ortak kayıt yazıcısı/okuyucusu RVA'ları `b8e1c0`/`b8e9c0`) güncel yapıda **başka koda** denk geliyor. Kaymış yazıcının güncel karşılığı **FUN_140bc75e0** bulundu; **okuyucu ikizi güncel yapıda alınamadı** (açık iş §17/1).
- **Kural:** Bu dokümandaki her adres atıfı (a) "güncel SHA + taze decompile satırı" veya (b) "eski SHA `a4dcabe8…` + *eski yapı*" etiketiyle okunmalı; **çıplak RVA asla güncel yapıya taşınmaz**. ideRPT.exe sabiti de düzeltildi: `"IDERPT FILE 11.01"` (eski kayıtlardaki "11.00" değil).

---

## 1. Kanıt etiketi sözleşmesi

| Etiket | Anlamı |
|---|---|
| **KANIT** | Tek değişkenli diferansiyel deney (M0–M6), decompile satır atfı, census çapası veya oracle ölçümüyle desteklenmiş kural |
| **VARSAYIM** | Kanıtsız/eksik kanıtlı kural; şemada `assumption: true` bayrağı taşır; F3 girdisi değildir |

Uydurma yok: ölçülmemiş her kural açıkça VARSAYIM etiketlenir ya da §17 açık iş listesinde kalır.

---

## 2. Taşıyıcı ve alt-akış çerçevesi

### 2.1 Taşıyıcı

- Kabul sürüm ailesi: `201091 / 201094 / 211040 / 211220 / 211280`. **KANIT** — `trial-acceptance.test.ts` (11.28 kabul ailesi), `ide-binary-codec.ts`.
- **Sürüm etiketi kuralı:** taşıyıcı sürümü, gövdeyi **yazan yazıcının** sürümüdür; sabit değer mühürlenmez, kaynak sürümü korunur. **KANIT** — `140989c30.c L40-44` (yazıcı `0x33950`=211280'i kendi sürümüyle yazar; proje kayıt sürümü varsa onu kullanır) + 05-REA-ÇAPRAZ §2.2.
- Başlık alanları: u32 sürüm `@74`; kilit baytları `previewEnd+28` (öğrenci) / `previewEnd+29` (demo) — format ayırımı sürümden değil kilit baytından. **KANIT** — T-F1.3.
- CRC32 sözleşmesi: ham CRC32, başlangıç `0xffffffff`, polinom `0xedb88320`, bayt `[88, EOF)`, final XOR yok. **KANIT** — `native-integrity-2026-11-04/selected-carriers-before-repair.json` `checksumContract` birebir (05-REA §1/10).

### 2.2 Alt-akış çerçevesi (v10 gövdesinin yapı taşı)

```
[u32 201094][u32 compLen][u32 rawLen][zlib deflate gövde (0x78 başlangıçlı)]
```

**KANIT** — `ide-zlib.ts scanIde201094Streams`; T-F2.4 census çapası: A0 = **30.260** akış, comp 116.600.559 B / raw 412.781.980 B, 30.260/30.260 hatasız açılma (Adler-32 dahili).

**Boş yuva davranışı:** F9/hesap yuvaları kayıtta **önceden hazır boş çerçevelerdir** — `rawLen=4`, içerik `00 00 00 00`. F9 çalışınca aynı çerçeveler **konum-korumalı** içerikle dolar (0 yeni/silinen çerçeve). **KANIT** — M0: A dosyasında 137/137 akış boş yuvaydı; F9 sonrası B'de aynı 137 çerçevenin 136'sı doldu (+128 KB; s29–s135 = 107 düğüm kaydı ekranla birebir).

**v11 notu:** encoded v11 gövdede çerçeveler Blowfish kodlaması altında düz metinde görünmez; yalnız **1** düz zlib akış kalır — A0 #1885'in bayt-özdeş ikizi (B0@36.758.804, X11@36.772.778). **KANIT** — bytemap-A0.md §7.

---

## 3. Üst düzey kayıt akışı (yazıcı 0x140989c30 — güncel SHA, bayt-özdeş doğrulanmış)

Kayıt sırası (üst → alt; decompile satır atıflarıyla):

| # | Alan | Koşul | Kanıt |
|---|---|---|---|
| 1 | u32 gövde sürümü (0x33950=211280 veya proje sürümü) | — | `140989c30.c L40-44` |
| 2 | u8 sabit 1 | — | L45-46 |
| 3 | storing dalı: 2×u32 (+ storing konumu u32) | storing modu | L49-59, L118-123 |
| 4 | u8 | sürüm > 201017 (0x31139) | L61-64 |
| 5 | u8 | sürüm > 201018 (0x3113a) | L65-68 |
| 6 | **u32 marker 0x5ce** | sürüm ≥ 211016 (0x33848) | L69-78; okuyucu `14098b600.c L60-77` |
| 7 | sürüm-geçmiş listesi `[u32 n][n×u32 sürüm][n×f64 zaman]` | sürüm ≥ 165400 (0x28618) | L81-112 |
| 8 | u8 global bayrak (+0x19a09) | — | L114-117 |
| 9 | 3×u32 sabit (0x22d08/0x4bf0/0x540) | — | L124-129 |
| 10 | alt serileştiriciler (FUN_140864b90, FUN_1405b1020, FUN_140eec320, FUN_14100b960, FUN_140ef4840, FUN_140b466b0, FUN_140a6d010) | — | L79-80, L130-134 |
| 11 | u32 | sürüm < 211240 (0x33928) | L135-138 |
| 12 | proje dizesi `[u8 bayrak][u32 len][bayt]` @+0x155 | — | L139-149 |
| 13 | **kat listesi** `[u32 katSayısı][katSayısı × KAYIT-KAT]` (FUN_1409c8330; okuyucu FUN_1409c6ff0) | — | L235-245; okuyucu L239-251 |
| 14 | liste `[u32 n][n × FUN_140ad3270]` @+0x1ae | — | L246-256 |
| 15 | **varlık listesi** `[u32 n][n × FUN_1408eb0c0]` (aktif kat @+0x11e) | — | L257-272 |
| 16 | çizim tanım listesi üreticisi **FUN_140a8c5e0** (→ #1885) | — | L276 — **VARSAYIM** (dal ataması güçlü ama tam değil, §17/3) |
| 17 | **ayar alanları serileştiricisi FUN_14098d270** (kodlu f64'lar FUN_140437e60) | — | L277 |
| 18 | u32 mod @+0x8cc (sürüm < 211002'de 5→4 düzeltmesi) | 0x3383a | L278-288; okuyucu L374-389 |
| 19 | u32 @+0x11a, u32 @+0x8d4 | — | L289-292 |
| 20 | u8 @+0x11b, u8 @+0x8d9 | sürüm > 179999 | L293-301 |
| 21 | u8 @+0x8da | sürüm > 180012 (0x2bf2c) | L302-306 |
| 22 | u32 @+0x8f4 | — | L307-308 |
| 23 | u32 @+0x11f | sürüm > 161999 | L309-312 |
| 24 | **çerçeve listesi** `[u32 n @+0x1a3][n × FRAME_SIZES kaydı]` | sürüm > 179999 | **L624-636** |

Okuyucu (0x14098b600): sürüm < 160100 (0x27164) → **reddet** (L53-56); kat okuyucusu FUN_1409c6ff0 (L239-251); alt-varlık listesi sürüm > 161999'da okunur (L149-169); @+0x8cc kenetleme/duzeltmesi (L374-389). Eleman **fabrikası** (0x1409441c0): u32 tür koduna göre switch — case 2/5 → FUN_141fccbd0; case 3/6/8/9/10 → FUN_140bc4c80(…,tür); case 4 → FUN_14059e0e0 (L43).

**Kapsam dürüstlüğü:** yazıcının L150-618 orta bloğu (kat/varsayım serileştiricileri) bu fazda alan düzeyinde **açılmadı**; tasiyici işlevler ve sınırlar kayıtlıdır, alan adı uydurulmaz (§17/6).

---

## 4. Eleman ortak kaydı (FUN_140bc75e0 — güncel yapıda kaymış yazıcının karşılığı)

Yazım sırası (nesne üyesi ofsetleriyle; dosya ofseti değişken uzunluklu alanlara göre kayar):

| Sıra | Üye | Tip | Not | Kanıt |
|---|---|---|---|---|
| 1 | +0xbc | `[u32 n][n×16B]` | ilişki çiftleri (iki f64/öge, kodlu) | L19-29 |
| 2 | +0xa4 | u32 | skaler | L31-32 |
| 3 | **+0x68** | f64 | **nativeZ — yazım ×2** | **L33** `(+0x68)+(+0x68)` |
| 4 | **+0x58** | f64 | **genişlik — yazım ×3** (`_DAT_145331218`=3.0) | **L34** |
| 5 | +0x2c | u32 | skaler | L35-36 |
| 6 | +0xa0 | `[u32 n][n×u32]` | tamsayı dizisi | L37-45 |
| 7 | — | **16B opak** | **4×rand() u32; liste uzunluğundan bağımsız; KORUNUR** | **L47-54** |
| 8 | +0x50 | f64 | skaler | L55 |
| 9 | +0x38 | `[u32 n][n×u32]` | dizi | L56-66 |
| 10 | +0x48 | `[u32 n][n×u32]` | dizi | L67-77 |
| 11 | +0x60 | f64 | skaler | L78 |
| 12 | +0xcc..+0xd8 | **4×f32 (16B) bbox** | **koşullu**: global bayrak +0x19a09 sıfırsa yazılır; 8B sayısal blok gibi çözülmez | **L79-85** |
| 13 | +0x90 | `[u8][u32 len][ad]` | ad dizesi | L86-99 |
| 14 | +0xa8 | u32 | | L100-101 |
| 15 | +8 | u32 | durum bayrakları; eski okuyucu < 211150'te 0x4000 bitini temizler | L102-103 |
| 16 | +0xb4 | u32 | | L104-105 |
| 17 | +0xc4 | u32 | sürüm ≥ 180502 (0x2c116) | L106-109 |
| 18 | +0xb8, +0xac | u32 | | L110-113 |
| 19 | +0x88/+0x80 | `[u32 n][n×8B]` nesne listesi (FUN_140be6db0) | **yalnız sürüm < 162000** | L114-129 |
| 20 | +0xc8 | u32 | sürüm ≥ 180500 (0x2c114) | L130-133 |
| 21 | +0x10 | `[u32 n][n×32B]` (FUN_1404366b0; n=(+0x18−+0x10)/32) | sürüm > 189999; eşik 190000 | L134-140 |
| 22 | +0x28 | u8 kuyruk bayrağı | sürüm > 189999 | L141-144 |

**Eski yapı okuyucu ikizi** (SHA `a4dcabe8…`, RVA `0xb8e1c0`): ×2/×3 çarpanlarını **bayraklar +0x10/+0x11 setse** ×0,5/×1/3 ile geri alır; 16B opak bloğu okur ve **discard** eder; bbox'ı bayrak sıfırsa +0xcc'ye okur. Aynı içerik, eski SHA çapasıyla **KANIT**.

---

## 5. Eleman geometri kaydı (repo okuyucusuyla 1.266/1.266 doğrulanmış düzen)

`p` = kayıt başlangıcı; `tail = p + 8 + count×16` (nokta bloğu sonrası):

```
[u32 türKodu][u32 count][count × (f64 x, f64 y)]        ← p+8'den itibaren
tail+0   u32 nativeId (≠0)
tail+4   f64 nativeZ   — encoded okumada ×0,5
tail+12  f64 genişlik  — encoded okumada ×1/3
tail+20  u32 layerId
[u32 n][n×u32] referans listesi 0
  ↳ encoded 211220 ailesinde: +16B OPAK (4×u32; yazar 4×rand())  ← index.ts L240-244
f64 rotasyon
[u32 n][n×u32] referans listesi 1 (ilişkiler)
[u32 n][n×u32] referans listesi 2
f64 yanal ofset  ← cursor+8 == kayıt sonu
```

**KANIT** — `ide-import/index.ts L225-263` (1.266/1.266 geometri parmak izi oracle'ı; 05-REA §2.5); ölçek çarpanları §4 L33-34 ile aynı kural. *v1.0.1 not:* şema bu tail-göreli ofsetleri artık açıkça taşır — ELEMAN-GEOMETRI `sira≥4` satırlarında `offsetTabani:"tail"` (0/4/12/20/24 ofsetleri p-göreli değil tail-görelidir).

---

## 6. Çerçeve boyut tabloları (FRAME_SIZES) ve kodlu f64 dizisi

- **FRAME_SIZES = `[u32 N][N×4B ham dizi]`** (+ opsiyonel `[u8 bayrak][u32 len][dize]` kuyruğu). Yazıcı/okuyucu **FUN_1408fa1f0** (okuyucu L21-60, yazıcı L63-75, dize L76-94); üst yazıcıdan çağrı: `140989c30.c L624-636`, **sürüm > 179999** koşuluyla, liste `param_1[0x1a2]` (A0'da 1.057 adet). Boyut sınıfları: 820=4+204×4 (945 adet), 1636=4+408×4 (56), 5716=4+1428×4 (56), 17140=4+4284×4 (ör. #100) — **hepsi N%6==0**. **KANIT** (t25 B6).
- **"Düğüm başına 6 kuvvet bileşeni (Fx,Fy,Fz,Mx,My,Mz)" yorumu VARSAYIM** — decompile yalnız 4 baytluk ham değer yazımı görür; semantik T-F2.7'de veriyle kanıtlanmalı.
- **Kodlu f64 dizisi = `[u32 n][n×8B]`**, her f64 **FUN_1404c11d0** kodlayıcısından geçer (Blowfish tarzı sayısal codec; `trial-blowfish-context.json` takvimi). **FUN_140436460** (pass5; kodlayıcı çağrısı L38, 8B yazım L55). v10 düz / v11 kodlu ayrımını açıklar. **KANIT**.
- **Ayar alanları yazıcısı FUN_14098d270** (üst yazıcı L277'den çağrılır): 1B bayraklar ve **kodlu f64** alanları sürüm ≥ 162000 koşuluyla yazar/okur (`14098d270.c L13-59`). M2/M3'teki "kodlanmış 8B kayıt" sınıfının yapısal karşılığı budur.

---

## 7. Ayar kayıtları — M0/M1–M6 ile ölçülmüş alan offset'leri

Koordinat sistemi: **M-base** (464.850 B `.ide11trial`, SHA `BD32651E…`, 211280/encoded) — A0'a doğrudan taşınmaz. Yöntem: tabanı yeniden aç → **tek ayar** değiştir → `Ctrl+S`; M-ctrl kontrol deneyi (aç→kaydet, 4.553 B/711 grup) gürültüden arındırılmış diff.

| Alan | Konum (M-base) | Değişim | Kaynak |
|---|---|---|---|
| **Zemin taşıma gücü qt** | **@112899, 8B kodlanmış** | 42→45 tf/m²: `8f7f17a268cd40a0 → 426b53f4f19c961d`; düz f64/f32/i32 **yok** | **KANIT** — M2-diff (kimlik + konum + 8B kodlu kayıt ampirik gerçektir). *Kodlu f64 temsili + FUN_14098d270→FUN_140437e60 üye eşleşmesi ise VARSAYIM'dır* — şema v1.0.1'de satır ikiye ayrıldı (ampirik=KANIT, yapısal=VARSAYIM; G2 savcı B1/T1) |
| qt-sayaç ailesi | @147265-147269 (5B), @243159, @245802, @396536 (+1) | qt tetiklediği yeniden hesap/sayaç baytları (mod-periyot gap bölgesi); M3'te taban değerinde | **KANIT** — M2-diff + M3 çaprazı |
| **Döşeme Q (yük tanımı)** | **@28843, 8B kodlanmış** + **@28859, 6B ikincil** | "Kullanıcı Tanımlı 0.15"→"Düşük Döşeme 0.532" tf/m²: `19b1bbe8443bf11a → 6c833fbf0c10f3c1`; `0100ffffffff → 000003000000`; qt bölgesinden **ayrık** (M2 @112899'a dokunulmadı) | **KANIT** — t23b M3-diff |
| **Rapor "Öde Kapak"** | **@113429, 1B bayrak** | 01→00 tek bayt; akışlar/boyut değişmez | **KANIT** — M6-diff |
| **Zemin yatak katsayısı ks** (2500→3000) | ön-gövde: **RYT analiz önbellek bloğu düşer** (−11.872 B; `22*..*RYT4` işareti kaybolur; ilk akış 157.072→145.200) | analizi geçersiz kılan sınıf: önbellek atılır, **akış yuvaları yerinde kalır**; ks değerinin kendi kodlanmış kaydı çözülemedi | **KANIT** — M1-diff |
| **Radye Q** (0.2→0.15) | M1 ile **aynı desen** (−11.409 B önbellek düşürme) | yük sınıfı ayarlar = ks mekanizması | **KANIT** — M4-diff |
| **Kiriş donatısı** | **s0–s23 akışları** (8×[1516+436+436], dosya 157.052–196.759) | Ø14-alt kapandı + F9 → K1 alt 2Ø14→3Ø12: **tam bu grup değişti**; mod periyotları ve s27/s28 kuvvet tabloları değişmedi → **donatı taşıyıcısı kimliği KANIT** (M0 VARSAYIM'I kapandı) | **KANIT** — M5-diff |
| Düğüm sonuç kayıtları | s29–s135 (107×460 B, 315.287–362.247) | F9 "arttırılmış sonuçlarla yeniden hesap" adımında 92/107'si değişti | **KANIT** — M0/M5 |
| Büyük kuvvet tabloları | s27 (210.793–227.979, raw 31.448) + s136 (365.146–380.394, raw 30.169) | donatı mutasyonunda değişmedi (eleman kuvvet tabloları) | **KANIT** — M0/M5 |
| Oturum sayacı (gürültü) | @19512-19524 (13B, kayıt başı +1) | nondeterministik sınıf — deney işaretleyicisi, ayara özgü değildir | **KANIT** — M2/M3 |
| Akış-aralığı yeniden hesap (gürültü) | @160257 civarı (13B kayıtlar) | kontrol deneyinde de değişir | **KANIT** — M2-diff |

Yapısal bağlam: qt/döşeme-Q/kapak gibi **salt kontrol/rapor ayarları** yalnız kodlanmış ön-gövde kayıtlarına yazar (boyut değişmez, akışlar özdeş); **analizi geçersiz kılan ayarlar** (ks, radye Q) önbellek bloğunu düşürür; **tasarım (donatı) değişiklikleri akışlara** yazar — üç sınıf hiç karışmaz. **KANIT** — t23-rapor §Yapısal keşifler.

---

## 8. Ölçek kuralları

- **nativeZ: yazım ×2; encoded okuma ×0,5.** **KANIT** — `140bc75e0.c L33`; eski yapı okuyucusu `b8e2a5` (bayraklar +0x10/+0x11); repo okuyucu `index.ts L229` (encoded dosyada ×0,5, 1.266/1.266 doğrulamalı).
- **Genişlik: yazım ×3 (0x145331218'deki double = 3.0); encoded okuma ×1/3.** **KANIT** — `140bc75e0.c L34`; `find-rip-scale-consts.mjs`.
- **Kapsam:** çarpanlar **yalnız bu iki skaler alana** özgüdür — dosyadaki her sayıya ve akış içi f32/f64 tablolara **uygulanmaz**.
- **Okuyucu ikizi güncel yapıda alınamadı** (3 prologue adayı ölçek içermiyor; 0,5+1/3 RIP çifti yok) — ölçek kuralları tek-kanallı değil (yazıcı + eski yapı + repo davranışı), tam decompile ikizi açık iş (§17/1).

---

## 9. Opak bloklar

- **16B rand bloğu:** yazıcı **4×rand()** u32 yazar (FUN_140bc75e0 L47-54); kodlamalı okuyucu okur ve **discard** eder; liste uzunluğundan bağımsız; **dönüşümde aynen korunur, "temizlenmez"**. Repo gözlemi: encoded 211220 ailesi eleman kaydında ilk referans listesinden sonra (liste boş olsa bile) 16B (`index.ts L240-244`). **KANIT**.
- **bbox float32 16B (koşullu):** global bayrak +0x19a09 **sıfırsa** yazılır (4×f32, +0xcc..+0xd8); **8 baytlık sayısal blok gibi çözülmez**. **KANIT** — L79-85; eski yazıcı `b8ec3b` / okuyucu `b8e545`.

---

## 10. Sürüm koşulları tablosu

| Eşik (hex/dec) | Etki | Kanıt |
|---|---|---|
| 0x27164 / 160100 | okuyucu alt sürüm tabanı: altı reddedilir | `14098b600.c L53-56` |
| 0x278cf–0x278d0 / 161999–162000 | < 162000: ortak kayda +0x80 nesne listesi; ≥ 162000: üst yazıcı u32 @+0x11f + ayar alanları koşulu | `140bc75e0.c L114-129`; `140989c30.c L309-312`; `14098d270.c L13-59` |
| 0x28618 / 165400 | sürüm-geçmiş listesi | `140989c30.c L81-112` |
| 0x29811 / 170001 | vtable+8 kaydı @param_1[0x13b] | `140989c30.c L619-621` |
| 0x2bf2c / 180012 | u8 @+0x8da | `140989c30.c L302-306` |
| 0x2c114 / 180500 | u32 @+0xc8 | `140bc75e0.c L130-133` |
| 0x2c116 / 180502 | u32 @+0xc4 | `140bc75e0.c L106-109` |
| 179999 / 180000 | u8 @+0x11b, @+0x8d9; **çerçeve listesi [u32 n][n×FRAME_SIZES]** — A0 (201094) kapsam içinde | `140989c30.c L293-301, L624-636` |
| 189999/190000 | [u32 n][n×32B] blogu (FUN_1404366b0) + u8 @+0x28 | `140bc75e0.c L134-144` |
| 0x31139/0x3113a / 201017–201018 | belge başı 1B alanları | `140989c30.c L61-68` |
| 0x3383a / 211002 | u32 @+0x8cc: 5→4 düzeltmesi | `140989c30.c L278-288`; okuyucu L374-389 |
| 0x33848 / 211016 | marker u32 0x5ce | `140989c30.c L69-78`; okuyucu L60-77 |
| **0x338ce / 211150** | **story reference B +4 (§11)** | REA findings + eski okuyucu `b8e645` |
| 0x33928 / 211240 | u32 ek alanı (<); okuyucu @+0x8cc==2 bayrağı | `140989c30.c L135-138`; okuyucu L382-384 |
| 0x33950 / 211280 | güncel yazıcının varsayılan sürümü | `140989c30.c L40` |
| **encodedFlag = 1** (format bayrağı, sürüm eşiği değil) | ELEMAN-GEOMETRI sira-9 OPAK 16B (4×u32) ilk referans listesinden sonra yazılır (liste boş olsa bile); bayrak=0 (v10 201094) ise yazılmaz — şema v1.0.1'de sözlüğe `V-ENCODED` olarak bağlandı | `index.ts L240-244` |

---

## 11. +4 viewport kuralı — sürüm ≥ 211150 (plan bağlaması)

**Kural:** kat başlığında ek 4 baytlık **"story reference B"** yalnız **sürüm ≥ 211150 (0x338ce)** olduğunda okunur/yazılır; viewport ölçeği 201094'te **+28**, 211220'de **+32**'de başlar.

**KANIT** — `trial-numeric-codec-findings-2026-10-30.md` (kat başlığı okuyucusu `0x9938a0`/`0x993a67`, eski SHA çapasıyla); 05-REA-ÇAPRAZ §2.3; eski yapı ortak kayıt okuyucusunda da 0x338ce karşılaştırması (`trial-common-record-static.json b8e645`).

> **YASAK:** genel "encoded ⇒ +4" çıkarımı. REA uyarısı aynen geçerli: *"A broad 'encoded means +4' inference would be wrong for other versions, so this version boundary should be applied explicitly."* F3/F4 üretiminde `v11Schema ? 4 : 0` değil, **sürüm koşulu** uygulanır.

---

## 12. Döşeme "36" etiketi (p+470)

Döşeme/radye kaydında (`p` = CP1254+NUL ad dizesinin bitimi; `shift` = v11 şemasında +4, v10 201094'te 0):

| Konum | Alan | Kanıt |
|---|---|---|
| p+466 | u32 imza **43** (döşeme) / **11** (radye) | `index.ts L309`; `record-builders.ts L516` |
| **p+470** | **u32 etiket 36 — yalnız v11 şema kaydında**; v10 (201094) kaydında bu 4 bayt **yoktur**, sonraki alanlar +4 kayar; v11→v10 dönüşümde `p+470..p+474` çıkarılır | `index.ts L309` (`v11Schema && u32@p+470===36` şartı); `ide11-transcoder.ts L346, L358-360`; `record-builders.ts L517-519` (yalnız ide11 yazar) |
| p+470+shift | u32 sabit 1 | `index.ts L309` |
| p+475+shift | u32 sabit 1 | `index.ts L309` |
| p+481+shift | f64 G/hareketli adayı (transcoder `slabLoadOverrides.live` hedefi) — **semantik adı VARSAYIM** | `ide11-transcoder.ts L347-356` |
| p+489+shift | u32 imza 85 (radyede 1) | `index.ts L309` |
| p+493+shift | u32 imza 45 (radyede 81/65) | `index.ts L309` |
| p+497+shift | f64 Q/ölü yük | `index.ts L310`; 525/525 doğrulama |
| p+505+shift | f64 kaplama (finish) | `index.ts L311` |
| p+513+shift | f64 hareketli yük — **525/525 normal döşeme okuma alanı** | `index.ts L308+L312`; rehber:39 ("p+513") |
| p+772+shift | hesap aksları bloğu (denklem + 4 kaynak noktası) | `index.ts L324-327`; `record-builders.ts L531-544` |

"36" sayısın **ölçülmüş** değeri etikettir; **semantik adı kurulmamıştır** (VARSAYIM). Radye temeli kaydında iki encoded alanın temel için anlamı da henüz kurulmamıştır (`ide11-transcoder.ts L349-351` notu).

---

## 13. Merdiven alt-akışı sürümü

Merdiven şablon kaydından sonraki analiz ağı alt-akışı **sürüm işaretçisi** taşır:

```
[u8 sabit 1][u8 sabit 1][u8 sürüm-bayrağı][u32 sürüm = 211220][10B ara][zlib 0x78 gövde]
```

- v11 kaydında: bayrak=1, sürüm=211220. **v10 (201094) hedefine dönüşte bayrak 0 yazılır ve sürüm alanına hedef sürüm yazılır.**
- **KANIT** — `ide11-transcoder.ts L380-387` (işaret deseni `work[at]==1 ∧ work[at+1]==1 ∧ (at+2 ∈ {0,1}) ∧ u32(at+3)==211220 ∧ work[at+15]==0x78`; yeniden yazım L383-384). A0 envanterinde 7 merdiven × 1 analiz ağı (tamsayı-kayıt, rawLen 147.712..211.504 + 153.636×4) — bytemap-A0.md §3.1.
- Üretici fonksiyon satırı decompile ile bağlanmadı (ampirik transcoder kanıt); merdiven graf dönüşümleri için hazır REA kanıtı: `ide10-2026-10-28/stair-graph-*.json`, `stair-transforms.json`.

---

## 14. Modal periyot bölgesi (akış-dışı düz f64)

M0 bulgusu (M-base koordinatı): ekran mod periyotları dosyada **akış DIŞI gövde bölgesinde, DÜZ f64** (Blowfish kodlamasız) olarak bulunur — s27 bitişi (227.979) ile s29 başlangıcı (315.287) arasındaki gap'te:

- **Mode 3 T = 0.03801594350107567 → @248907** (ekran 0.03802)
- **Mode 1 T = 0.16059170853931365 → @248915** (ekran 0.16059) — tek kayıt, ±8 bayt komşu, çevresi sıfır dolgu.

**KANIT (bit-exact):** iki değer A dosyasının **hiçbir** yerinde yok (tam f64 bayt deseni araması) → F9 yazdığı kesin. **KANIT** — M0-diff (d), `t22-modal-tam-eslesme.log`.

**Çözülemeyen:** Mode 2 (0.13299), Mode 4 (0.03574), Mode 5 (0.02920), Mode 6 (0.00433) konumları düz f64/ENC-tek-blok/f32/T²/ω² formlarında bulunamadı; akış içinde yalnızca **gevşek f32 adayları** var (örn. s27 raw+10912 = 0.0357457, ~%0,02 uzak) — **olasılık düzeyi, VARSAYIM**. Ayrıca 0.97 katılım ve 0.998 FE kalite ölçütü tam eşleşmeyle bulunamadı. Kayıt sırasındaki ters düzen (önce Mode 3 değeri, sonra Mode 1) açıklanamadı.

---

## 15. Akış-dışı taşıyıcı bölgeleri (t24 konumları, A0 koordinatı)

| Taşıyıcı | Konum | İçerik | Kanıt |
|---|---|---|---|
| **R1 malzeme** | `@36.402.671` boşluğu — `TEMEL TASARIM ZARFI\0` | C25 B420C (beton) + S235 (çelik); 2/2 oracle | bytemap-A0.md §5 |
| **R3 deprem/zemin** | akış-dışı düz bölge | 10/10 alan: XC2, r=6, oran=0,77947, n=0,3, ko=3080, qt=55, I=1, DSF1: ss=0,429 s1=0,143 sds=0,3861 sd1=0,1144 (+ lat 39,6584 lon 35,8734) | bytemap-A0.md §5 |
| **R4 donatı** | eleman kaydında **akış-sonrası** tamsayı kuyruğu | 468 `rebarLayout` = 178 perde + 289 kiriş + 1 radye; 468/468 oracle; kiriş donatısı s0–s23 akışlarında (M5) | bytemap-A0.md §5; M5-diff |
| **R5 modal** | **kuyruk** 145.103.614..145.671.130 (567.516 B akış-dışı düz bölge) | 10 modal tablo + **DSF1 tayfı @145.264.162** + G1 koordinat | bytemap-A0.md §4/§5 |
| Modal periyot (M-base) | 227.979..315.287 gap; f64 çifti @248.907/248.915 | §14 | M0-diff (d) |
| RYT analiz önbelleği (M-base) | ilk akış öncesi ön-gövde; `22*..*RYT4` işaretli | analizi geçersiz kılan ayarda kayıttan düşer (−11,5 KB) | M1/M4-diff |

Kat: 6/6 (ASANSÖR MAK.DAİRESİ dahil). Parser 1.273 kayıt çözdü; parmak izi oracle'ı 1.266 geometri — **7 merdiven farkı** bu gramerin tamsayı-kayıt sınıfıyla netleşir (merdivenler geometri oracle'ında sayılmaz, analiz ağları §13'te tanımlıdır).

---

## 16. A0 alt-akış tip envanteri ve açıklama oranı

| Tip | Adet | Eşleşme kuralı | Kaynak |
|---|---:|---|---|
| ELEMAN-OZNITELIK | 1.885 | bölge kuralı: eleman kaydı içinde | KANIT |
| — f32-tablo (FRAME_SIZES) | 1.659 | `rawLen=4+4N ∧ ilkU32=N ∧ N%6==0` (kiriş 1.071 + perde 588) | KANIT |
| — boş yuva | 212 | `rawLen∈{4,16} ∧ payload sıfır` (döşeme 152×16B + döşeme kenarı 60×4B) | KANIT |
| — tamsayı-kayıt | 14 | kalan (döşeme FEM ağı 7 + merdiven analiz ağı 7); iç gramer açık iş | bölge KANIT |

*Alt-tip çözümleme önceliği (v1.0.1):* rawLen=4'te boş yuva ↔ f32-tablo (N=0) koşulları çakışır — **"boş yuva önce"** kuralı uygulanır (rawLen=4 ∧ payload tam sıfır → boş yuva; aksi halde f32-tablo); 1659/212/14 dağılımı ancak bu öncelikle çıkar (şema `altTipCozumOnceligi`).
| CIZIM-BICEM-TABLOSU (#1885) | 1 | ARA bölge + `rawLen=813.063`; ilk u32 1461; `Arial\0` + `CONTINUOUS\0` dizeleri | içerik KANIT; üretici dalı VARSAYIM |
| R5-F9-DUGUM-YERDEGISTIRME | 28.001 | F9 düğüm bloğu + `rawLen=13.564` | KANIT |
| R5-F9-KABUK-SONUC | 373 | F9 kabuk bloğu + `rawLen≥45 ∧ (rawLen−17)%28==0` | KANIT |

**Sınama (G2):** şemanın bölge+yapısal kuralları `bytemap-A0.json`'ın 30.260 satırına karşı koşuldu — **sonuç %100,00 (30.260/30.260)**, t24 etiketleriyle 0 çakışma (t24'ün tek BILINMEYEN'i #1885'in kimliği T-F2.5 içerik analiziyle yükseltildi). T-F2.4'ün kendi dürüst tabanı: bilinen %99,997 + 1 BILINMEYEN. Ayrıntı+sayılar: `evidence/orkestrasyon/2026-11-18-F2-T2.6/test-cikti/t26-aciklama-orani.log`. **≥%95 G2 ölçütü karşılandı.**

---

## 17. Açık işler ve VARSAYIM listesi (G2 savcı turu girdisi)

1. **Ortak kayıt okuyucu ikizi güncel yapıda alınamadı** — ölçek geri-okuma (×0,5/×1/3, bayrak +0x10/+0x11) yalnız eski yapıda ve repo okuyucu davranışında kanıtlı; güncel decompile tek kanallı (yazıcı FUN_140bc75e0). [t25 açık iş 1]
2. **FRAME_SIZES "6 bileşen/düğüm" yorumu VARSAYIM** — N%6==0 düzeni şekille uyumlu; semantik veri tarafından kanıtlanmalı (T-F2.7). [t25 B6]
3. **#1885 uç dize fonksiyonu** — içerik kimliği KANIT (çizim biçem/tanım tablosu; Arial/CONTINUOUS; F9/kuvvet tablosu DEĞİL); üretici dalı (FUN_140a8c5e0 zinciri + FUN_140a88880 jumptable dize satırı) ve "1461" sayısının semantik adı açık. [t25 açık iş 3]
4. **Mode 2/4/5/6 periyot konumları çözülemedi** — gevşek f32 adayları olasılık düzeyi; VARSAYIM. [M0-diff (e)/1]
5. **0x1407a9e80 (çerçeve vtable+8 Serialize adayı)** .pdata RUNTIME_FUNCTION girdisi yok → decompile alınamadı. [t25 açık iş 2]
6. **Belge yazıcısının orta bloğu (L150-618) alan düzeyinde açılmadı** — tasiyici işlevler kayıtlı, alan adları uydurulmadı; F3'te gerektikçe T-F2.7 onaylı açılır.
7. **Döşeme p+481+shift f64 alanının semantik adı** (G/hareketli adayı) ve "36" etiketinin anlamı — davranış ölçülmüş, ad VARSAYIM.
8. **Merdiven alt-akış işaretçisinin üretici satırı** decompile ile bağlanmadı (ampirik transcoder kanıtı).
9. **Kurulu EXE sürüm çapası** — §0 kuralı: adres atıfları SHA+satır çapasıyla okunmalı; yeni EXE güncellemesinde atıflar yeniden doğrulanmadan kural üretime alınmaz.
10. **M3-scope dürüstlüğü:** döşeme Q mutasyonu komut/yük tanım combosudur (proje varsayılanı); mevcut döşeme objelerinin jeometri/kuvvet akışları F9 tetiklenmediği için değişmez (137/137 akış özdeş bunu doğrular).

---

## 18. Yükcü-farazi sözleşmeler + A0-kalıntı envanteri (v1.0.2 — G3 bağlamaları)

F3 çöküş zinciri (t34/t34b) ve H2 onarımı (t33d) sayesinde artık **KANIT** statüsünde olan iki üretim sözleşmesi (şema `yukcuFaraziSozlesmeler`). Bu satırlar `assumption:true` taşımaz — üretim yükleyicisinin VARSAYIM hard-fail'i bunları **tetiklemez**; t34c'de v3 gerçek ideCAD'de çökmesiz açılarak sözleşmeler gerçek yükleyicide doğrulandı.

1. **YFS-1 — akış-dışı koşuların v10 yerleşimi A0-donör nakliyle üretilir.** v11 yerleşimi gerçek v10 yükleyicisinde sayım→realloc→memcpy hattında erişim ihlali üretir: 0xc0000005, VCRUNTIME140.dll ~0x1de2x memcpy bölgesi (t34: HS_B0_F3 3/3 APPCRASH; t34b: v2 3/3 APPCRASH, uzaklıklar 0x1de31/0x1de2c/0x1de23 — v1≡v2 çökme sınıfı özdeş → değer sınıfı elenir, **yerleşim** sınıfı kazanır; imza analizi). Onarım H2: A0'dan akış-indeks çapasıyla gap-düzeyi nakil (t33d; ölçüt (i) beş bölge Δlen=0, (iv) yaban-sayım 0; t34c'de açılış çökmesiz). **KANIT** — t34-rapor, t34b-rapor, fikir-t33d H2, t33d-rapor ölçüt (i)/(iv), t34c-rapor.
2. **YFS-2 — katalog-dışı f64 alanları gövde-geni kodtablosu süpürmesiyle düzleştirilir.** v10 yükleyicisi her f64'ı FUN_140436060 düz dalıyla okur; kodlu artıklar değer konumunda zararsız, **sayım konumunda ölümcüldür**. H1'in kısmi katkısı: 477.416 artık blok yerinde çözüldü (t33c tek kök düzeltme), ama yerleşim sınıfını düzeltmez (t34b imza analizi — yerleşim YFS-1'dedir). **KANIT** — t33c-rapor, t34b-rapor, decompile 1408eb0c0.c.

### A0-kalıntı envanteri (şemaya `meta.a0KalantiEnvanteri` özeti; tam liste kanıt logunda)

- **612 yeniden-hesap alanı (ULP sınıfı):** geometri f64 356.190 alanın 355.578'i bit-özdeş; 612 alan |Δ|≤1e-9 (maks 1,78e-14; dağılım: nokta.x 145, nokta.y 271, genişlik 157, nativeZ 39 — v11 ×0,5/×1/3 ölçek ve ağ yeniden hesap sınıfı); **v11 kaynak kazanır** — v10 taşıyıcısında A0 değeri kalır, üzerine yazılmaz.
- **392 perde etiketi kanonik sapması:** 196 perde etiketi × 2 yuva (wallLabel + wallLabelName); "25/255"↔"255/25" ("310/25"↔"25/310" vb.) **parse-eşit** (labelDiff=0); v10 taşıyıcısında A0'nın depolanan biçimi esastır (aşağıdaki belge).
- **0 gerçek değer çatışması** (10,67↔11,15 sınıfı YOK).
- **Tam liste + yol atfı:** `evidence/orkestrasyon/2026-11-19-F3-T3.3d/test-cikti/t33d-a0-kalanti-envanteri.log` (devir: fikir-t33d §2 — sessiz değil). **KANIT** — t33d-rapor + G3 savcı S2(c)/S5 + hakem §4 (bağlanan bulgu; kabul engeli değil).

### Perde etiketi kanonik belgesi — taşıyıcı-özdeş esası

**Kural:** perde etiketinin v10 taşıyıcısındaki kanonik biçimi **A0'nın depolanan biçimidir** ("255/25"); t33 hasadının sunduğu biçim ("25/255") yalnız v11 tarafının değer dizilimidir — v10 yazımında A0 baytları korunur; parse düzeyinde biçimler anlamsal eşittir (labelDiff=0, 392 yuva işaretli). **KANIT** — t33d-rapor B0-wins bulgusu + envanter logu §3 + G3 savcı S2(c)/hakem §4.

**v11 yazım ölçüm yolu (not):** v11 yazımında (transcodeIde10ToIde11) X11 referansının **depolanan** biçimi ölçülerek eşleştirilir; bu ölçüm **T-F4.1** görevine aittir ve paralel koşmaktadır — bu bölüm İLKİYİ (taşıyıcı-özdeş esası) koyar, ölçüm sonucunu önceden yazmaz.

---

## 19. Kanıt yolu dizini

- **T-F2.2 (M0):** `…/2026-11-18-F2-T2.2/rea/M0-diff.md` + `rea/M0-{A,B,work}.ide11trial` (SHA listesi raporda) + `test-cikiti/t22-rapor.md`, `t22-akist-tarama.log`, `t22-modal-*.log` (5 dosya)
- **T-F2.3 (M1–M6):** `…/2026-11-18-F2-T2.3/rea/M1..M6-diff.md` + `M-{base,ctrl,1..6}.ide11trial` + `test-cikiti/t23-rapor.md`, `t23-akis-tarama-M*.log`, `t23-govde-grup-M2-M6.log`
- **T-F2.3b (M3):** `…/2026-11-19-F2-T2.3b/rea/M3-diff.md` + `test-cikti/t23b-rapor.md`, `t23b-diff-analiz.log`
- **T-F2.4 (byte-map):** `…/2026-11-18-F2-T2.4/rea/bytemap-A0.md` + `bytemap-A0.json` (30.260 satır) + `bytemap-B0-X11.json` + `test-cikti/t24-rapor.md`
- **T-F2.5 (decompile):** `…/2026-11-18-F2-T2.5/rea/OKUBENI.md` + `rea/ana-exe{,-pass2..5}/*.c` + `rea/1885-raw.bin` + `rea/t25-iderpt-bundle.json` + `test-cikiti/t25-rapor.md`, `t25-hedef-hashleri.txt`
- **REA arşivi:** `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\ide10-2026-10-28\` (`trial-common-record-static.json`, `trial-numeric-codec-findings-2026-10-30.md`, `trial-format-findings-2026-10-29.md`, `trial-blowfish-context.json`, `unsupported-records.json`, `stair-graph-*.json`) + `native-2026-11-04/` + `native-integrity-2026-11-04/`
- **Çapraz doğrulama:** `…/05-REA-CAPRAZ-DOGRULAMA.md`, `…/09-FAZ-GOREV-HARITASI.md` (T-F2.6/T-F3.3 satırları)
- **Repo kodu (davranış kanıtı):** `src/lib/hsyncad/ide-import/index.ts`, `ide11-transcoder.ts`, `ide-binary-codec.ts`; `src/lib/hsyncad/ide-write/record-builders.ts`; `docs/hsyncad/IDECAD_BIREBIR_ESLESME_REHBERI.md`
- **Sınama kanıtı:** `…/2026-11-18-F2-T2.6/test-cikti/t26-aciklama-orani.log` + `t26-rapor.md`
- **F3 çöküş/onarım zinciri (v1.0.2 kaynakları):** `…/2026-11-19-F3-T3.3c/rapor/t33c-rapor.md` · `…/2026-11-19-F3-T3.3d/rapor/t33d-rapor.md` + `fikir-t33d.md` + `test-cikti/t33d-a0-kalanti-envanteri.log` · `…/2026-11-19-F3-T3.4/test-cikti/t34-rapor.md` · `…/2026-11-19-F3-T3.4b/test-cikti/t34b-rapor.md` · `…/2026-11-19-F3-T3.4c/test-cikti/t34c-rapor.md` · `…/2026-11-19-F3-G3/rapor/g3-savci-rapor.md` + `g3-hakem-rapor.md`

*Bu harita kampanya F2 fazının sentez ürünüdür; canlı kanıtlarla çelişen her satır güncel kanıtla düzeltilir (yaşayan doküman).*
