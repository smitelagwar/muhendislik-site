# Vercel CLI & Canlı / Preview Test Kuralları

> **Ön koşul:** GitHub'a yazma veya deployment işlemi öncesinde repo kökündeki `AGENTS.md` zorunlu olarak okunur. Bu dosya `AGENTS.md` ile birlikte uygulanır. Kullanıcının o anki açık talebi her zaman en yüksek önceliktedir.

Bu çalışma alanı Vercel projesi `muhendislik-site` ile GitHub üzerinden bağlıdır.

## 1. Çalışma Modeline Göre Deployment Standartları

### A) Antigravity / Yerel IDE Geliştirme (Normal Akış)
- Geliştirme, typecheck (`npx tsc --noEmit`), kalite kapıları (`npm run check:tools`) ve build (`npm run build`) **yerel bilgisayarda** yapılır.
- Tüm kontroller yeşil olduğunda kullanıcı veya IDE ajanı tek bir anlamlı atomik commit ile `main` branch'ine push yapar.
- Bu aşamada Vercel'in `main` branch'i için **otomatik Production Deployment** alması tam olarak hedeflenen ve onaylanan davranıştır.

### B) ChatGPT / Uzaktan Sohbet & API Modu (Kota Koruma Akışı)
- ChatGPT gibi araçlar GitHub Contents API üzerinden dosya dosya ara commit atarken her commit için Vercel build'i başlatılması **YASAKTIR**.
- ChatGPT veya uzaktan AI oturumları:
  1. Doğrudan `main` branch'ine yazamaz.
  2. `internal-*` veya `chatgpt-*` çalışma branch'i kullanmalıdır.
  3. Ara commit mesajlarına mutlaka `[skip ci]` veya `[skip vercel]` eklemelidir.
- Bu kural Vercel build sürelerini, rate-limit'leri ve deployment kotasını korur.

---

## 2. Plan Başına Deployment Bütçesi

Bir planın tamamı için toplam bütçe:

- **Preview:** en fazla 4 kez (tercihen 0–1 kez)
- **Production:** en fazla 1 kez ve yalnız plan tamamen bittikten sonra `main` push ile

Kullanılmayan Preview hakkını kullanmak zorunlu değildir; varsayılan hedef mümkünse **0 Preview** ile ilerlemek ve doğrudan doğrulanmış yerel build sonrası tek `main` push yapmaktır.

---

## 3. Production Kuralı

Production deploy planın ara aşamalarında yapılmaz.

Production için zorunlu sıra:
1. Bütün plan aşamaları tamamlanmış olmalı,
2. İlgili CI/typecheck/build/test kapıları yerelde yeşil olmalı,
3. `main` branch'ine tek atomik commit pushlanmalıdır.

---

## 4. Korunacak Production Build Sözleşmesi

- `package.json` içindeki build komutu `next build --webpack` olarak kalır.
- `vercel.json` build komutu `npm run build` olarak kalır; böylece `prebuild` içindeki CAD worker/WASM/font senkronu atlanmaz.
- Next production typecheck'i `next.config.ts -> typescript.tsconfigPath: "tsconfig.next.json"` üzerinden yalnız deploy edilen runtime kaynaklarını kapsar.
- Genel `tsconfig.json` script ve test kalite kapılarını kapsamaya devam eder.
- Vercel token'ı Markdown'a, kaynak koda, komut geçmişine veya sohbete düz metin olarak yazılmaz.
