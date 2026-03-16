# Standart Malzeme Değerleri

## Beton Sınıfları (TS 500 / TS EN 206)

| Sınıf | fck (MPa) | fcd (MPa) | fctk (MPa) | Ec (GPa) | TBDY Min. Kullanım |
|-------|-----------|-----------|------------|----------|--------------------|
| C16/20 | 16 | 10.7 | 1.4 | 27 | Kullanılmaz (depremli bölge) |
| C20/25 | 20 | 13.3 | 1.6 | 29 | Sınırlı (SDS, 1-2 kat) |
| C25/30 | 25 | 16.7 | 1.8 | 30 | Minimum önerilen |
| C30/37 | 30 | 20.0 | 1.9 | 32 | Yaygın kullanım |
| C35/45 | 35 | 23.3 | 2.1 | 34 | Yüksek yapılar |
| C40/50 | 40 | 26.7 | 2.2 | 35 | Perde, yüksek katlı |

> fcd = fck / γc, γc = 1.5  
> TBDY 2018 Md. 7.2.1: Depremli bölgelerde min. C25 zorunlu (kolon ve kiriş)

## Donatı Çeliği Sınıfları (TS 708)

| Sınıf | fyk (MPa) | fyd (MPa) | εsu (%) | TBDY Uyumu |
|-------|-----------|-----------|---------|-----------|
| S220 | 220 | 191 | 15 | SDY'de kullanılamaz |
| B420C | 420 | 365 | 9 | SDY ve SDS uyumlu ✓ |
| B500C | 500 | 435 | 8 | SDY ve SDS uyumlu ✓ |

> fyd = fyk / γs, γs = 1.15  
> TBDY 2018 Md. 7.2.3: SDY için B420C veya B500C zorunlu

## Yapısal Çelik Sınıfları (TS EN 10025)

| Sınıf | fy (MPa) | fu (MPa) | Notlar |
|-------|---------|---------|-------|
| S235 | 235 | 360 | Hafif çelik |
| S275 | 275 | 430 | Orta yapılar |
| S355 | 355 | 510 | Endüstriyel yapılar |
| S420 | 420 | 520 | Özel uygulamalar |

## Zemin Sınıfları (TBDY 2018, Tablo 2.1)

| Zemin Sınıfı | VS30 (m/s) | Açıklama |
|-------------|-----------|---------|
| ZA | > 1500 | Sert kaya |
| ZB | 760-1500 | Kaya |
| ZC | 360-760 | Çok sıkı kum/çakıl veya sert kil |
| ZD | 180-360 | Orta sıkı kum/çakıl veya katı kil |
| ZE | < 180 | Gevşek kum veya yumuşak-orta sert kil |
| ZF | — | Özel inceleme gerektiren zeminler |

## Deprem Düzeyleri (TBDY 2018)

| Deprem Düzeyi | Aşılma Olasılığı | Tekrar Periyodu | Kullanım |
|--------------|-----------------|-----------------|---------|
| DD-1 | %2 / 50 yıl | 2475 yıl | Göçme kontrolü |
| DD-2 | %10 / 50 yıl | 475 yıl | Tasarım depremi |
| DD-3 | %50 / 50 yıl | 72 yıl | Hasar sınırı |
| DD-4 | %68 / 50 yıl | 43 yıl | Servis depremi |

## Davranış Katsayıları R (Seçilmiş Sistemler)

| Taşıyıcı Sistem | Süneklik | R | D | Referans |
|----------------|---------|---|---|---------|
| BA çerçeve | SDY | 8 | 3 | TBDY Tablo 4.1 |
| BA çerçeve | SDS | 4 | 2.5 | TBDY Tablo 4.1 |
| BA perde-çerçeve | SDY | 7 | 2.5 | TBDY Tablo 4.1 |
| BA perde-çerçeve | SDS | 4 | 2.5 | TBDY Tablo 4.1 |
| BA boşluksuz perde | SDY | 6 | 2.5 | TBDY Tablo 4.1 |
| Çelik çerçeve | SDY | 8 | 3 | TBDY Tablo 4.1 |
