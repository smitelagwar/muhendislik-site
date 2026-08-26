# DEPLOYMENT FREEZE — Deprem ve Yönetmelikler Görsel Yenileme

Bu repo, `/kategori/deprem-yonetmelik` kapsamındaki 164 içeriğin görsel sistemini yenilemek için aktif uzun çalışma fazındadır.

## Freeze durumu

- **Preview deployment:** YASAK
- **Production deployment:** YASAK
- **Vercel promote:** YASAK
- **Vercel redeploy:** YASAK
- **Manuel CLI/API deployment:** YASAK

## Çalışma branch'i

`internal-deprem-visual-refresh-20260826`

Bu branch, görsel yenileme planı tamamlanana kadar deployment üretmemelidir.

## Başlangıç baseline

- Main başlangıç commit'i: `68951f44e17759f96d0632ac4b2733978f440328`
- Freeze öncesi görülen son Vercel deployment: `dpl_4bF1kcnBoZcHVpa2mwZUrHL528pc`
- O deployment'ın GitHub commit'i: `68951f44e17759f96d0632ac4b2733978f440328`
- Hedef: freeze başladıktan sonra **0 yeni Preview / 0 yeni Production deployment**

## Teknik kilit

`vercel.json` içinde çalışma boyunca:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

korunacaktır.

## Yasak komutlar

Plan bitene kadar aşağıdakiler çalıştırılmaz:

```text
vercel
vercel deploy
vercel --prod
vercel deploy --prod
vercel deploy --prebuilt
vercel deploy --prebuilt --prod
vercel promote
vercel rollback
```

Ayrıca Vercel Dashboard `Redeploy`, REST/SDK deployment oluşturma ve başka CI üzerinden deployment yasaktır.

## QA yaklaşımı

Geliştirme doğrulaması Vercel Preview yerine local/CI ile yapılır:

```text
ilgili kalite scriptleri
npx tsc --noEmit
npm run build
local browser / Playwright / Puppeteer
```

## Freeze'in kaldırılması

Bu dosya ve `git.deploymentEnabled: false` ancak şu koşulların tamamı sağlandıktan sonra kaldırılabilir:

1. 164/164 konu tamamlandı.
2. Her konu için en az 2 özgün görsel mevcut (minimum 328 görsel).
3. Teknik QA, görsel QA, duplicate kontrolü ve responsive QA geçti.
4. TypeScript/build/CI geçti.
5. Freeze boyunca yeni deployment oluşmadığı doğrulandı.
6. Kullanıcı ayrıca ve açıkça final yayın talimatı verdi.

Planın tamamlanmış olması tek başına yayın izni değildir.
