# ECC (Everything Claude Code) Kuralları ve Çalışma Standardı

> Bu kural dosyası `ecc/` deposunun projeyle entegrasyonunu, Gemini için okuma zorunluluğunu ve açma/kapatma (toggle) sistemini yönetir.

## 1. Entegrasyon Durumu

DURUM: AKTİF <!-- ECC_STATUS:ACTIVE -->

---

## 2. Gemini İçin Zorunlu Talimat

> **KURAL:** Eğer Gemini isen ve ECC durumu **AKTİF** ise, `ecc/` github reposunu okumalı, buradaki mimari ve güvenlik standartlarını dikkate almalısın.

Durum **AKTİF** iken Gemini'nin yapması gerekenler:
1. **Zorunlu Başlangıç Okuması:**
   - `ecc/.gemini/GEMINI.md`: Gemini CLI için hazırlanmış temel ECC prensipleri, güvenlik kontrol listesi ve teslimat standartları.
   - `ecc/the-shortform-guide.md` veya `ecc/README.md`: Hızlı referans ve harness optimizasyon mantığı.
2. **Göreve Göre Becerilerden Yararlanma:**
   - Görevin konusuna göre `ecc/skills/` dizinindeki 300+ beceriyi (örn: `test-driven-development`, `secure-code-review`, `performance-optimization`, `continuous-learning-v2`) ve `ecc/agents/` altındaki uzmanlık rollerini referans al.
3. **Repo Öncelik Sıralaması:**
   - Bu projenin `PROJECT.md`, `AGENTS.md` ve CAD/DXF koruma kuralları (`.agents/rules/cad-dxf-engine-koruma.md`) en üst önceliktir. ECC standartları bu ana kurallarla çelişmeden bir uzmanlık katmanı olarak uygulanır.

---

## 3. Basit Deaktivasyon / Aktivasyon (Açma-Kapama) Sistemi

Kullanıcı ileride ECC'yi devre dışı bırakmak veya tekrar açmak istediğinde:

### A) Sohbet Üzerinden (Doğal Dil):
- Kullanıcı *"ecc github reposunu kullanma"*, *"ecc deaktive et"*, *"ecc kapat"* dediğinde:
  - Gemini durumu derhal **PASİF** yapar (`npm run ecc:disable` çalıştırır veya bayrağı günceller).
  - Bundan sonra `ecc/` deposu okunmaz ve göz ardı edilir.
- Kullanıcı *"ecc aktive et"*, *"ecc aç"*, *"ecc reposunu kullan"* dediğinde:
  - Gemini durumu derhal **AKTİF** yapar (`npm run ecc:enable` çalıştırır).

### B) Komut Satırı / NPM Scriptleri:
- Durum sorgulama: `npm run ecc:status`
- Deaktive etme (Pasif): `npm run ecc:disable`
- Aktive etme (Aktif): `npm run ecc:enable`
- Durumu tersine çevirme: `npm run ecc:toggle`
- PowerShell alternatif: `.\scripts\toggle-ecc.ps1 -Disable` / `.\scripts\toggle-ecc.ps1 -Enable`
