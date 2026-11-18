# Codex CLI — zorunlu okuma

Codex/ChatGPT'ye CLI üzerinden bağlanma, istem/görev gönderme, model/akıl yürütme düzeyi seçme veya CLI sorun giderme işinde **komuttan önce** [codex-cli skill](C:/Users/hsyn/.codex/skills/codex-cli/SKILL.md) okunur ve uygulanır.

Ortak kılavuz: `C:\Users\hsyn\.codex\skills\codex-cli\SKILL.md`. Codex, Claude, Gemini ve diğer AI ajanları aynı Markdown dosyasını okuyabilir. Farklı makine/`CODEX_HOME` için gerçek skill yolunu doğrula; dosya yoksa okunamadığını bildir. Yalnız eski Codex sohbetini okuma işi bu kuralı tetiklemez; `AGENTS.md` sohbet kimliği kısa yolu kullanılır.

Projede görev aktarırken önce `PROJECT.md`, `AGENTS.md` ve ilgili kuralları oku, aynı kapsam ve yetki sınırlarını CLI görevine ekle. CLI kullanımı commit/push/deploy izni oluşturmaz. Modelin sonuç iddiasını gerçek diff ve ilgili testlerle kontrol et.
