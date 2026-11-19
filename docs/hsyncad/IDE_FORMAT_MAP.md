# IDE biçim haritası — taşıyıcı sürümü / gövde şeması sözleşmesi

**Tarih:** 19 Kasım 2026 · **Görev:** T-F7.2 ("ideCAD uzantı dönüşümü" kampanyası, F7 fazı)
**Amaç:** hangi taşıyıcı sürümü hangi gövde şemasıyla eşleşir, hangi yönde hangi araçla dönüşür ve kabul nasıl ölçülür — tamamı ölçülmüş kaynak atıflı.
**Kanıt kökü:** `C:\Users\hsyn\Desktop\hsyncad_idecad_uzanti_optimizasyon\evidence\orkestrasyon\` (aşağıda bölüm bölüm atıflı) · kampanya ana belgeleri aynı klasörde (`02-DONUSUM-MATRISI.md`, `11-KABUL-VE-KANIT-PROTOKOLU.md`).
**Dürüstlük ilkesi:** her satır ölçüm/atıf kaynaklıdır; ölçütlerin **tek kaynağı 11-KABUL §2'dir** (bkz. §3). Gövde kayıt/alt-akış gramerinin ayrıntısı: [IDE10_GOVDE_GRAMERI.md](IDE10_GOVDE_GRAMERI.md) (şema v1.0.2).

---

## 1. Taşıyıcı sürümü → gövde şeması (ölçülmüş eşleşme)

| Taşıyıcı sürümü | Gövde şeması | Ölçülen gerçek | Kanıt |
|---|---|---|---|
| `201091` | v10 düz (kurulum şablonu) | Kurulumun boş statik şablon etiketi; `hsyn.ide10` gerçek ideCAD'de açıldı | `02-DONUSUM-MATRISI.md` §3; eski sürüm bu belgenin 5 Kasım kaydı |
| `201094` (0x31186) | **v10 düz**: zlib alt-akış çerçevesi `[u32 201094][u32 compLen][u32 rawLen][0x78 deflate]` + **akış-dışı bölgeler** (R1 malzeme `@36.402.671`, R3 deprem/zemin, R4 donatı akış-sonrası kuyruk, R5 modal 567.516 B düz bölge) | A0 = **30.260** alt-akış, comp 116.600.559 B / raw 412.781.980 B, 30.260/30.260 hatasız açılma; encodedFlag=0; Hsyncad v3 çıktısı raw toplamı A0 ile birebir, comp −%0,218 (±%1 bandı) | `2026-11-19-F3-G3/test-cikti/attribute-stream-census.json` + `rapor/g3-hakem-rapor.md` tanık koşusu; `IDE10_GOVDE_GRAMERI.md` §2.2/§15 |
| `211220` (0x33914) | **v11 encoded**: encodedFlag=1; alt-akış çerçeve işaretçisi **u32 0x33914**; f64 alanları Blowfish tarzı kodlama (`FUN_1404c11d0`); kat başlığında **+4 story reference B** (sürüm ≥ 211150 koşulu — "encoded ⇒ +4" genellemesi yasak); döşeme kaydında `p+470` u32 etiket **36** (v10'da yok); encoded okuma ölçekleri nativeZ ×0,5 / genişlik ×1/3 | X11_downloads.ide11 (211220/1): 30.259×0x33914 çerçevesi + 1× düz 201094 ikiz #1885; **2 malzeme + 468 donatı + 10 modal tablo** okunur, değerler A0 ile birebir (46/46 log; frekans ≤1e-9); ko yuvası koşulluluğu v10=568 / 211220=677 / 211280=561 | `2026-11-19-F5-G5/rapor/g5-critic-rapor.md` + `2026-11-19-F5-T5.1/test-cikti/t51-deger-karsilastirma.log`; işaretçi sayımı `2026-11-19-F4-G4/test-cikti/g4-critic-tanik.log` (30.261/30.261 + 2/2); `IDE10_GOVDE_GRAMERI.md` §6/§8/§11/§12 |
| `211280` (0x33950) | v11 encoded (güncel yazıcının kendi sürümü) + **trial taşısı** | ideCAD'in belge yazıcısı kendi derleme sürümünü yazar (`native-2026-11-04/140989c30.c` L40-43 → 0x33950); trial/ayırım sürümden değil **kilit baytlarından**: `previewEnd+28` (öğrenci) / `previewEnd+29` (demo). Bu baytların "deneme kilidi" yorumu **sürüme bağlıdır ve doğrulanmış bir sürüm/semantik çözümü değildir** (v10 örneğinde demo baytı 1, v11 örneğinde 3 — aynı konum farklı anlam). Gerçek 211280 etiketli dosyalar (B0/C1 trial kayıtları) ideCAD 11.28'de açılıyor | `02-DONUSUM-MATRISI.md` §3/§4 + `05-REA-CAPRAZ-DOGRULAMA.md` §4.1; kilit baytı ölçümü T-F1.3 (`IDE10_GOVDE_GRAMERI.md` §2.1); 211280 donatı/F9 akışları okuma kapsamı dışı — `g5-critic-rapor.md` taşınan sınırlar |
| `211040` | üretici `.cde` (sıkıştırılmış gövde) | zlib gövde çözülür, plan okunur; dönüşüm matrisinde yeri yoktur | `02-DONUSUM-MATRISI.md` §1 son satır; eski belge "Sayılar ve sıkıştırma" bölümü |

### Etiket/gövde uyum kuralı (operasyonel)

**Etiket, gövdeyi yazan yazıcının sürümüdür; gövde değiştiyse etiket de değişmiş olmalıdır.** ideCAD 11.28 bir dosyayı taşıyıcı sürümü gövdenin şemasıyla uyumlu olduğu sürece açar; sürümün kendisi engel değildir, uyumsuzluk (ör. v11 şema 211280 gövdesi + 211220 etiketi) dosyayı reddettirir. **KANIT** — `02-DONUSUM-MATRISI.md` §3 "çıkarılan kural" + §4 ölçülen tablo; REA birincil kanıtı `native-2026-11-04/140989c30.c:40-43`. Arayüzdeki biçim etiketi bu yüzden sürüm yerine kilit baytına dayanır (`getIdeCarrierFormat`); aksi hâlde ideCAD'in kendi 211280 `.ide11` çıktısı "trial" sanılır ve dışa aktarım yanlış kapanır (`02-DONUSUM-MATRISI.md` §5/4).

> **Etiket uyarısı:** "ideCAD kalitesinde" ifadesi teknik eşdeğerlik anlamındadır (dosya ideCAD'de açılıyor, ölçülen içerik birebir). Bayt temizleme yoluyla üretilen çıktının ticari/lisanslı dosya olarak sunulması REA tarafından doğrulanmamıştır; bu ürün sahibinin kararıdır (`02-DONUSUM-MATRISI.md` §4 son not).

---

## 2. Dönüşüm matrisi (yön → araç → yerleşim sözleşmesi)

`02-DONUSUM-MATRISI.md` §1/§2 (18 Kasım) **kampanya-başı taban kaydıdır**; F3 ve F4 (19 Kasım) `.ide10` yönlerini ölçümlü olarak değiştirdi. Aşağıdaki tablo kampanya sonrası durumdur.

| Kaynak → Hedef | Üretim yolu | Ölçülmüş sonuç | Yerleşim sözleşmesi | Kanıt |
|---|---|---|---|---|
| `.ide11trial` → `.ide11` | `transcodeIde11TrialToIde11` | 1.266/1.266 geometri; `HS_B0_orijinal.ide11` (211280) ve `HS_X11_downloads.ide11` (211220) gerçek ideCAD 11.28'de **AÇILDI**; sadakat ideCAD'in kendi `.ide11` çıktısının okunabilirlik profiliyle aynı | sürüm/encoded bayrakları korunur; bayt temizleme yolu | `02-DONUSUM-MATRISI.md` §1/§2/§3 |
| `.ide11` → `.ide11` | `transcodeIde11TrialToIde11` | geçişlilik: 0 fark | — | `02-DONUSUM-MATRISI.md` §1 |
| `.ide11trial` / `.ide11` → `.ide10` | `transcodeIde11TrialToIde10` + CLI `--donor <aynı proje .ide10>` | `HS_B0_F3_v3.ide10` (201094): 30.260/30.260 alt-akış, raw 412.781.980 B = A0 birebir; R1 2/2, R3 10/10, R4 468/468, R5 10 tablo sapma 0; geometri 1.266+7; kat 6/6; gerçek ideCAD'de **çökmesiz açılış** (v2'nin 3/3 APPCRASH sınıfı giderildi) + F9'suz iderpt raporu A0 ile **bayt-özdeş** (G3 hakem ONAY, 11/11 ölçüt) | **YFS-1** akış-dışı koşuların v10 yerleşimi A0-donör nakliyle üretilir (v11 yerleşimi gerçek yükleyicide sayım→realloc→memcpy ihlali, 0xc0000005); **YFS-2** katalog-dışı f64 alanları gövde-geni kodtablosu süpürmesiyle düzleştirilir | şema v1.0.2 `yukcuFaraziSozlesmeler` (`IDE10_GOVDE_GRAMERI.md` §18; `2026-11-19-F2-T2.7c/test-cikti/t27c-rapor.md`); onarım zinciri t33c/t33d/t34c; `2026-11-19-F3-G3/rapor/g3-hakem-rapor.md` |
| `.ide10` → `.ide11` | `transcodeIde10ToIde11` + library `ide11Donor` (X11 sınıfı aynı-proje native `.ide11`) | `HS_A0_upgraded_v2.ide11` (211220/encoded): geometri/etiket/yük diff **0** (1.273/1.273, 159 yük, perde plan kesiti 196/196); gerçek ideCAD'de **tek denemede açıldı**, modal ağaç 10 durum + Malzemeler C25 B420C/S235 okundu (G4 critic ONAY) | X11-donör **gap-düzeyi yerleşim+ızgara nakli**: 30.261 akış-dışı gap'in tamamı (29.948.844 B) donörden bayt-bayt; donörsüz koşu gerçek yükleyicide çöker (t42: 0xc0000005 @ 0x7af4cb) | `2026-11-19-F4-T4.1b/rapor/t41b-rapor.md`; `2026-11-19-F4-G4/rapor/g4-critic-rapor.md` |
| `.ide11` düzenle → kaydet | hedefli 12-bayt yama (8B kodlanmış f64 + 4B CRC) | `HS_X11_downloads_duzenlenmis.ide11`: K34 kesidi 0.50→**0.55** gerçek ideCAD "Kiriş Ayarları"ndan okundu; değişmeyen 146.686.289 bayt **özdeş** (12/12 yalnız hedef baytlar: 8B @1377843 + 4B CRC @83); CRC mührü bağımsız bitwise CRC-32 ile geçerli (G6 hakem ONAY 5/5) | değişiklik-dışı **red** ilkesi korunur (9 red senaryosu) | `2026-11-19-F6-G6/rapor/g6-hakem-rapor.md` |
| `.ide10` → `.ide10`; aynı format kopya kaydet | `saveNativeIdeSource` | byte-eşit kopyalama; model değiştiyse/kaynak şema hedefte yoksa **reddedilir**, sessiz atlamaz | — | `02-DONUSUM-MATRISI.md` §1 |
| `.cde` (211040) → herhangi biri | — | yalnız plan okunur; sıkıştırılmış taşıyıcı dönüşümü yok | — | `02-DONUSUM-MATRISI.md` §1 |
| Hsyncad modeli → `.ide11/.ide10` | `synthesizeIdeFile` (yalnız araştırma kodu) | üretim yolu **değil**; sıfırdan native yazıcı ideCAD uyumluluğu sağlamıyor | — | `02-DONUSUM-MATRISI.md` §1; [NATIVE_INTEROP_STATUS.md](NATIVE_INTEROP_STATUS.md) |

**Kalan dürüst sınırlar:** R1–R5 v11 ızgara/yerleşim katmanı her iki yönde de **donör nakliyle** üretilir (sıfırdan ızgara üretimi yok); A0-kalıntı envanteri (612 ULP sınıfı yeniden-hesap alanı |Δ|≤1e-9, 392 perde etiketi kanonik sapması parse-eşit, 0 gerçek değer çatışması) şema takip görevine bağlıdır — `2026-11-19-F3-T3.3d/test-cikti/t33d-a0-kalanti-envanteri.log`.

---

## 3. Kabul ölçütleri (atıf + özet)

**Ölçütlerin tek kaynağı `11-KABUL-VE-KANIT-PROTOKOLU.md` §2 oracle tablosudur; bu bölüm özettir, kopya değildir — çelişki durumunda 11-KABUL esastır ve bu belge sapmaz.** Kapı checklist'leri (G0–G8) aynı belgenin §3'ündedir.

Özetle, MUSTAFA SELVİ 1.KISIM referans seti üzerinde bir dönüşüm çıktısı "kabul" saymak için ölçülenler: `201094` alt-akış sayısı 30.260; R4 donatı 468/468 (178 perde + 289 kiriş + 1 radye); R1 malzeme 2/2 (C25 B420C, S235) + eleman eşlemi; R3 deprem/zemin 10/10 alan; R5 modal 10 tablo frekans sapması ≤1e-9; geometri 1.266/1.266 (1 µm); kat 6/6 (Asansör Mak. Dairesi dahil); döşeme yükü 159/159; kesit etiketi uydurma 0 (donör kaynaklı/boş); gerçek ideCAD açılışı pencere başlığı + kat ağacı kanıtıyla; F9'suz rapor + metraj ideCAD'in kendi çıktısıyla birebir. `.ide11` yönlü fark ölçütü: `evidence/diffs/` çıktısında geometri/etiket/yük farkı 0.

Bu ölçütlerin G3 (v11→v10) ve G4 (v10→v11) kapılarında 19 Kasım 2026'da ölçüldü ve ONAYLANDI: `2026-11-19-F3-G3/rapor/g3-hakem-rapor.md` (11/11 madde ÖLÇÜLDÜ) · `2026-11-19-F4-G4/rapor/g4-critic-rapor.md` (3/3 GEÇTİ).

---

## 4. Kullanım kılavuzu

### CLI — üretim dönüşümü

```powershell
# trial → ticari biçim .ide11 (sürüm/encoded korunur)
npx tsx scripts/hsyncad/convert_trial_to_native.ts <dosya.ide11trial> --to ide11

# v11 gövdesi → gerçek v10 gövdesi (YFS-1: aynı projenin native .ide10 donörünü ver)
npx tsx scripts/hsyncad/convert_trial_to_native.ts <dosya.ide11> --to ide10 --donor <ayni-proje.ide10>

# v10 → v11 ters şema yükseltme (+4 story-ref, 16B opak ped, ×2/×3 ölçek yazımı,
# döşeme 36, Blowfish f64 kodlama, 211220/encoded=1 mührü)
npx tsx scripts/hsyncad/convert_trial_to_native.ts <dosya.ide10> --to ide11
```

- `--to ide10` için `--donor` **önerilir**: donörsüz koşuda yerleşimi kurulmamış bölgeler v11 yerleşiminde kalır ve gerçek ideCAD yükleyicisinde erişim ihlali üretir (YFS-1, §2 tablosu).
- v10→v11 yönünde R1/R3/R4/R5 v11 ızgara + yerleşim katmanı, library düzeyindeki `ide11Donor` seçeneğiyle X11 sınıfı donörden nakledilir (`ide11-transcoder.ts`; kullanım deseni `ide10-upgrade.test.ts`).
- Aynı formatta kaydetme her özgün baytı korur; model değişikliği veya sürüm dönüşümü sessizce atlanmaz, hata verir.

### Ölçüm araç zinciri (11-KABUL §1 — tekrarlanabilir)

| Araç | Yol | İşlev |
|---|---|---|
| `ide-fidelity-audit` | `tools/ide-fidelity-audit.ts` | Dosya → kanonik parmak izi (kat, eleman, geometri, kesit, yük, donatı, malzeme, deprem, F9) |
| `compare-pairs` | `tools/compare-pairs.mjs` | İki parmak izi → alan düzeyi diff |
| `probe-attribute-streams` | `tools/probe-attribute-streams.ts` | `201094` zlib alt-akış sayımı |
| `generate-hsyncad-conversions` | `tools/generate-hsyncad-conversions.ts` | Hsyncad dönüştürücüleriyle kanıt dosyası üretimi |
| `build-tools` | `tools/build-tools.mjs` | Paketli (node_modules bağımsız) koşu |
| Masaüstü kabul | `scripts/idecad/desktop.py` + [IDECAD_DESKTOP_WORKFLOW.md](IDECAD_DESKTOP_WORKFLOW.md) | Gerçek ideCAD'de açma; başlık/kat ağacı; JSON+PNG kanıt |

### Kalıcı kabul kapısı

`scripts/hsyncad/ide-acceptance-gate.ts` (T-F7.1, paralel yazılıyor): üret → ölç → masaüstü kabul → kanıt yaz → özet; herhangi bir ölçüt kırmızıysa **exit ≠ 0**. Tamamlandığında bu bölüm tek komutla uçtan uca zincirin kullanımını tanımlayacak; görev kaydı `evidence/orkestrasyon/2026-11-19-F7-T7.1/`. Kapı, bundan sonraki her dönüşüm değişikliğinde tekrar koşulacak **sözleşmedir** (11-KABUL §3 G7: bu belgenin sürüm/gövde tablosunun güncelliği de o kapının ölçütlerindendir).

---

## 5. Kanıt yolu dizini

- Kampanya kökü: `C:\Users\hsyn\Desktop\hsyncad_idecad_uzanti_optimizasyon\` — `02-DONUSUM-MATRISI.md` (§1 yön matrisi taban kaydı, §3 açılma matrisi, §4 sürüm/gövde eşleşmesi), `11-KABUL-VE-KANIT-PROTOKOLU.md` (§1 araç zinciri, §2 oracle, §3 G0–G8), `05-REA-CAPRAZ-DOGRULAMA.md` (§4.1 kilit baytı sürüm-özellik uyarısı).
- F3/G3 (v11→v10): `…/2026-11-19-F3-G3/rapor/g3-hakem-rapor.md` + `test-cikti/attribute-stream-census.json` · onarım zinciri `…/2026-11-19-F3-T3.3c…T3.4c/` · A0-kalıntı `…/2026-11-19-F3-T3.3d/test-cikti/t33d-a0-kalanti-envanteri.log`.
- F4/G4 (v10→v11): `…/2026-11-19-F4-T4.1b/rapor/t41b-rapor.md` + `…/2026-11-19-F4-G4/rapor/g4-critic-rapor.md`.
- F5/G5 (encoded okuma): `…/2026-11-19-F5-G5/rapor/g5-critic-rapor.md` + `…/2026-11-19-F5-T5.1/test-cikti/t51-deger-karsilastirma.log`.
- F6/G6 (kaydetme roundtrip): `…/2026-11-19-F6-G6/rapor/g6-hakem-rapor.md` + `…/2026-11-19-F6-T6.1/test-cikti/t61-diff-kanit.log`.
- Şema v1.0.2: `…/2026-11-19-F2-T2.7c/test-cikti/t27c-rapor.md` + repo `src/lib/hsyncad/ide-import/ide10-grammar.json` (YFS-1/YFS-2, A0-kalıntı özeti).
- REA arşivi: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\native-2026-11-04\` (yazıcı `140989c30.c`).
- Repo davranış kanıtı: `scripts/hsyncad/convert_trial_to_native.ts`, `src/lib/hsyncad/ide-import/{index,ide11-transcoder,ide-binary-codec,numeric-codec}.ts`, `src/lib/hsyncad/ide-write/record-builders.ts`; birebir eşleştirme rehberi [IDECAD_BIREBIR_ESLESME_REHBERI.md](IDECAD_BIREBIR_ESLESME_REHBERI.md).

*Yaşayan doküman: canlı kanıtla çelişen her satır güncel kanıtla düzeltilir. Uygulama durumu: [NATIVE_INTEROP_STATUS.md](NATIVE_INTEROP_STATUS.md).*
