# Vercel CLI & Canlı / Preview Test Kuralları

> **Ön koşul:** GitHub'a yazma veya deployment işlemi öncesinde repo kökündeki `AGENTS.md` zorunlu olarak okunur. Bu dosya `AGENTS.md` ile birlikte uygulanır; çelişki halinde deployment sıklığı konusunda `AGENTS.md` geçerlidir.

Bu çalışma alanı Vercel projesi `muhendislik-site` ile GitHub üzerinden bağlıdır. `main` production deployment üretir; bazı çalışma branch'leri `vercel.json` içindeki `git.deploymentEnabled` kurallarıyla deployment dışı bırakılmıştır.

## 1. Preview varsayılan değildir

Vercel Preview normal geliştirme/test döngüsünün parçası olarak her committe oluşturulmaz.

Önce şu doğrulamalar tercih edilir:

- ilgili kalite scriptleri
- `npx tsc --noEmit`
- `npm run build`
- Playwright/Puppeteer veya eşdeğer local/CI browser testleri

Preview yalnız şu hallerde kullanılır:

1. kullanıcı açıkça ister,
2. çalışma release-candidate seviyesindedir ve gerçek Vercel ortamı doğrulaması gereklidir,
3. hata yalnız Vercel runtime/environment/deployment katmanında yeniden üretilebilmektedir.

## 2. Branch deployment koruması

Uzun AI/GitHub işleri için deployment kapalı branch kullanımı tercih edilir. `internal-*` branch'lerinin deployment üretmemesini sağlayan `vercel.json` kuralı korunmalıdır.

Mevcut özel audit/work branch'i için deployment kapatma kuralı varsa kullanıcı açıkça istemeden kaldırılmaz.

Bir branch'in deployment davranışı bilinmiyorsa peş peşe push yapılmadan önce doğrulanır.

## 3. Production kuralı

Production deploy yalnız kullanıcı açıkça istediğinde veya önceden tanımlanmış release akışının doğal sonucu olduğunda yapılır.

Şunlar production/deployment tetiklemek için kullanılmaz:

- noop commit
- probe commit
- geçici debug commit
- yalnız yeniden build başlatmak için anlamsız değişiklik
- aynı hatayı tekrar denemek için arka arkaya push

## 4. Smoke test

Bir deployment **bilerek oluşturulduysa**, deployment tamamlandıktan sonra ilgili sayfa/API rotaları smoke test edilir. Aynı doğrulama için yeni deployment üretmek yerine mevcut deployment üzerinde mümkün olan tüm kontroller tamamlanır.

## 5. Ortam değişkenleri ve servisler

Neon PostgreSQL, Vercel Blob ve Admin/Auth environment variable'ları proje ihtiyacına göre Production/Preview ortamlarında bulunabilir. Gerekirse Vercel ayarları veya CLI ile durum doğrulanır.

Environment variable kontrolü deployment oluşturmayı gerektirmiyorsa yalnız bu kontrol için deploy yapılmaz.

## 6. Temel amaç

Vercel bir sürekli deneme ortamı değil, deployment/release doğrulama katmanıdır.

**Önce local/CI doğrulama → sonra gerekliyse tek kontrollü Preview → yalnız release aşamasında Production.**
