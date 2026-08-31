# Aşama 01 — Binary Entegrasyon Teslimi

Bu dosya Aşama 01 için üretilen 6 adet 4K WebP'nin entegrasyon teslim bilgisini sabitler.

## Üretim durumu

- Proje & İzinler: PRIMARY + SECONDARY hazır.
- Mimari Proje: PRIMARY + SECONDARY hazır.
- Statik Proje: PRIMARY + SECONDARY hazır.
- Tüm çıktılar 3840×2160, 16:9 WebP.
- Görsel üretim ve yerel QC tamamlandı; QC puanları `stage-01-qc.md` içinde.
- Binary paket ChatGPT çalışma alanında ve kalıcı Library altında `Bina-Asamalari-Gorsel-Yenileme/Stage01/STAGE01_BINA_PATCH.zip` olarak saklandı.

## Hedef yollar

```text
public/bina-asamalari/topics/proje-hazirlik.webp
public/bina-asamalari/details/proje-hazirlik.webp
public/bina-asamalari/topics/mimari-proje.webp
public/bina-asamalari/details/mimari-proje.webp
public/bina-asamalari/topics/statik-proje.webp
public/bina-asamalari/details/statik-proje.webp
```

## SHA256

```text
STAGE01_BINA_PATCH.zip
8f11974ea458b0b310be2c3dc72d1db6e69df80ed258da23cbfdcb897b3876a7

mimari-proje-primary.webp
 a20fa6ce57ddccd35e9460862a0e93d6b530e6b390e7c24bfbd7ef39621e9c99
mimari-proje-secondary.webp
 bd6236a3e267a1e7b5974c194b0bc29c7e34f490167e65bb41d179098c6be815
proje-hazirlik-primary.webp
 0d5a22481bcc6470ec11a4ed13464330a4ee4a86ab5ebbb650f8c4bdcbeeef53
proje-hazirlik-secondary.webp
 c20a58349f857e4dcffc6024dc3d279979076139dc648a5d39100a18c9051ff7
statik-proje-primary.webp
 813e59d298de853ab9187d8689b99b6e3a076169af090f9acd281d02d2cb327d
statik-proje-secondary.webp
 c99d089bf4266b271956b9a92b9571a32be98239eca18addf85edcc400e6909e
```

## Connector kısıtı

Bu ChatGPT oturumundaki GitHub contents/Git Data yazma araçları UTF-8 metin veya çağrı gövdesine verilen base64 içerik yazabiliyor; yerel binary dosya parametresi kabul etmiyor. 6 adet yüksek kaliteli 4K asset bu nedenle bu branch'e doğrudan binary olarak aktarılamadı. Görsel kalitesini düşürerek connector limitine uydurmak yerine master çıktılar korunmuştur.

## Kapanış kapısı

Aşama 01 üretim/QC açısından tamamdır. `published` kapısı yalnız şu üç doğrulamayı bekler:

1. Paket içindeki 6 WebP'nin yukarıdaki hedef yollara kopyalanması.
2. `npm run check:bina-visuals` çalıştırılması.
3. Proje & İzinler, Mimari Proje ve Statik Proje route'larının 390 / 768 / 1440 px smoke kontrolü.

Binary aktarımı yapıldığında SHA256 değerleri bu dosyadaki değerlerle karşılaştırılmalı; farklıysa entegrasyon reddedilmelidir.
