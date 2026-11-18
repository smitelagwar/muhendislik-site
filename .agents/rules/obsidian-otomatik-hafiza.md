# Obsidian Otomatik Hafıza, Damıtma ve İkinci Beyin V3 Entegrasyon Kuralı

> **ZORUNLU KURAL (İKİNCİ BEYİN V3 & ÇİFT YÖNLÜ GÜVENLİ HAFIZA PROTOKOLÜ):** 
> 1. **Dikkate Alma / Okuma (Read & Apply - 3 Kademeli Hiyerarşi):**
>    - **L1 (Çekirdek):** Oturum başında `🔮 850-Companion/Core.md`, `Kurallar.md` ve `Notlar/Kişisel Profil ve Tercihler.md` (yalnızca `[AKTİF]` maddeler) zorunlu bağlam olarak alınır (~150-250 token).
>    - **L2 (Navigasyon):** Kapsam genişse `Notlar/Ana Harita.md` (MOC) veya `projects/<proje>/Kurallar.md` taranarak hedef alt not tespit edilir.
>    - **L3 (Derinlik):** Yalnızca göreve doğrudan etki eden tekil uzmanlık notu veya `beyin.py context "<konu>"` ile dönen pasajlar okunur; 500 dosya körlemesine yüklenmez.
> 2. **5 Devrimsel Sütun ile Yaşayan Hafıza:**
>    - **Sütun 1 (PreCompact & SessionEnd Otonom Diske Düşüş):** Token penceresi dolarken (compaction anında) veya oturum bittiğinde tüm ara kararlar, görev durumları ve öğrenimler anında diske mühürlenir.
>    - **Sütun 2 (Daylog ve Akşam Derleyicisi):** Gün içindeki tüm işlem akışı `Günlük/YYYY-MM-DD.md` dosyasına yazılır; gün bitiminde veya oturum sonunda kalıcı dersler süzülerek ilgili proje/kural notlarına damıtılır.
>    - **Sütun 3 ([[WikiLinks]] Atomik Gezinme):** Dış RAG'e gerek kalmadan çift yönlü wikilink bağlantılarıyla (`[[Hsyncad Motoru]]`, `[[Mühendis Mimar Portalı]]`) grafik traversali yapılır.
>    - **Sütun 4 (27/25 Sıfır Tolerans Halüsinasyon Sözleşmesi):** Kasada doğrulanmış Markdown kaynağı bulunmayan hiçbir kişisel bilgi, parametre veya kural tahmin edilemez. Kullanılan her bilgi `source: [[Not Adı]]` ile belgelenir; bilinmeyen açıkça "Kasada bilgi mevcut değil" denilerek bırakılır.
>    - **Sütun 5 (Kasa İçi Beceriler ve Dual Safety Pipeline):** Kasa içindeki `task-create`, `note-create`, `note-edit`, `context`, `receipt` komutları kullanılır. `beyin.py sync` yerel SQLite FTS indeksini günceller; `vault-sync.mjs` ise Git versiyonlamasını ve güvenli push'u yürütür.

## 1. Kasa Konumu ve Dosya Sözleşmesi
Tüm kalıcı dış hafıza `C:\Users\hsyn\Documents\Notlar` altında tutulur:
1. `🔮 850-Companion/`: V3 düşünme ortağı köprüsü (`Core.md`, `Kurallar.md`, `Last-Session.md`, `Threads.md`, `Journal.md`).
2. `Notlar/Kişisel Profil ve Tercihler.md`: Kimlik, iletişim prensipleri, sevilen/kaçınılan yaklaşımlar, çalışma tarzı.
3. `Notlar/Çalışma Kuralları ve Kararlar.md`: Standart ADR-Lifecycle formatındaki kronolojik kararlar (`[AKTİF]`, `[GEÇERSİZ KILINDI]`).
4. `Notlar/Projeler ve Repolar.md` & `projects/<proje>/`: Aktif projelerin envanteri ve projeye özel yerel kurallar (`muhendis-mimar-portali`, `hsyncad`).
5. `Günlük/YYYY-MM-DD.md`: Günlük odak maddeleri, tamamlanan işler ve yarına devreden adımlar.
6. `Notlar/Ana Harita.md`: Tüm notların MOC dizini (Her konu için 1 satır + `[[Wiki Link]]`).

## 2. Karar Yaşam Döngüsü Formatı (ADR-Lifecycle)
Karar defterine yazılan her kural şu formatta olmalıdır:
`- [DURUM] [TARİH] [ADR-KİMLİK] Konu: Kural Tanımı.`
- `[AKTİF]`: Yürürlükteki geçerli kural (AI sadece bunları uygular).
- `[GEÇERSİZ KILINDI - YYYY-MM-DD - Yerine: [[#ADR-XXX]]]`: Yeni kararla yürürlükten kalkan kural (Asla uygulanmaz).
- Çakışma durumunda en yeni tarihli kural geçerlidir; AI eski kuralı otomatik geçersiz kılar (Auto-Deprecation).

## 3. Kesin Filtreleme ve Damıtma Kapısı (Garbage Filter Gate)
- **Kalıcı (Damıtılacak):** "bundan sonra", "her zaman", "asla", "kuralımız şu", genel mimari tercihler, yeni repolar, tamamlanan iş özetleri.
- **YASAK (Asla Yazılmayacak):** "şimdilik", "geçici olarak", "bir kerelik", "dene bakalım", console.log, satırı yoruma alma, geçici port değiştirme, lokal tek satırlık kod yamaları, doğrulanmamış denemeler.

## 4. İki Kademeli Secret Scanner ve Sıfır Sızıntı (Dual-Layer Zero-Leak)
- **Katman 1 (Not İçi Redaksiyon):** `beyin.py preferences --secret-filter on` ile yerel redaction motoru (`beyin_v3_secrets.py`) API anahtarlarını, tokenları ve parolaları anında `[REDACTED]` yapar.
- **Katman 2 (Pre-Commit Gözetmeni):** `vault-sync.mjs` commit öncesi staged dosyaları 8 katı regex ile tarar; herhangi bir anahtar tespit edilirse işlemi iptal eder.

## 5. Senkronizasyon Protokolü ve Ayrık Sorumluluk
- **Adım 1 (Yerel İndeks):** Ajan notları düzenlediğinde kasa kökünde `py -3 beyin.py sync` çalıştırılarak `%LOCALAPPDATA%\beyin-v3` içindeki SQLite FTS güncellenir. Bu işlem Git komutu çalıştırmaz.
- **Adım 2 (Git Senkronizasyonu):** Oturum tamamlandığında `node c:\Users\hsyn\Desktop\muhendis-mimar-portali\scripts\obsidian\vault-sync.mjs` çalıştırılır. Betik; `.git/index.lock` temizliği, rebase ve push işlemlerini güvenle tamamlar.
