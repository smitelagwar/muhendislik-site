# Belgeler — Paylaşım Nihai V2 Uygulama Durumu

```yaml
plan_id: INSA-BELGELER-LINK-V2-20261023
plan_revision: 2
plan_file: PLAN/BELGELER_PAYLASIM_NIHAI_V2_PLAN.md
planning_status: PLAN_HAZIR
execution_status: BASLAMADI
source_branch: main
source_commit_at_planning: 323b064960bbdc9cbab0b4fbc55f74ca7f6fdf47
active_stage: null
next_stage: ASAMA_01
completed_stages: []
stages:
  ASAMA_01: { title: "Baseline ve Node flatten POC", status: PENDING }
  ASAMA_02: { title: "Akıllı dosya adı ve PDF İndir", status: PENDING }
  ASAMA_03: { title: "Paylaş arayüzü, backend kapalı", status: PENDING }
  ASAMA_04: { title: "Şema, private Blob, token ve kota", status: PENDING }
  ASAMA_05: { title: "Sunucuda PDF üretimi ve API", status: PENDING }
  ASAMA_06: { title: "Salt-okunur PDF viewer ve /b", status: PENDING }
  ASAMA_07: { title: "Bağlantı oluşturma, kopyalama, iptal", status: PENDING }
  ASAMA_08: { title: "Cron, purge ve retention", status: PENDING }
  ASAMA_09: { title: "Entegre kabul, güvenlik ve performans", status: PENDING }
  ASAMA_10: { title: "Tek Production release", status: PENDING }
decisions_locked:
  - "WhatsApp/native PDF paylaşımı, wa.me, navigator.share, QR, e-posta linki yok"
  - "Yalnız Paylaş > Bağlantı oluştur > Kopyala; 90 gun sabit"
  - "İndir editable kalır; link PDF'si sunucuda flatten:true oluşturulur"
  - "Anonim PDF byte upload yok; sunucu yalnız allowlist form JSON kabul eder"
  - "Ayrı belge_paylasim_links tablosu ve private belge_paylasim/ prefix"
  - "Görüntüleyici /b/[token]; dokumantasyon /p/[token] korunur"
  - "Önce DB revoke, sonra Blob sil; expire anında HTTP 410"
  - "Production DB/kota/Blob/secret yoksa fail-closed"
  - "ASAMA_10 öncesinde push veya Vercel deploy yok"
open_checks:
  - "ASAMA_01: yerel HEAD/worktree ile plan sürümü eşleştir"
  - "ASAMA_01: beş Node flatten POC görsel/metinsel ve boyut ölçümü"
  - "ASAMA_01: migration dizisi ve private Blob/Neon varlık kontrolü"
  - "ASAMA_10: BELGE_SHARE_SECRET ve CRON_SECRET üretimde var mı"
  - "ASAMA_10: Vercel Production READY ve canlı smoke"
evidence: []
blockers: []
updated_at: '2026-10-23T12:17:00+03:00'
```

**Uygulama henüz başlamadı.** Bu dosyada `PASS`, `FAIL`, `NOT_RUN` ayrımıyla yalnız gerçekten çalıştırılan komutlar/kanıtlar işlenmelidir. `ASAMA_10` bitince `execution_status: TAMAMLANDI`, `active_stage: null`, `next_stage: null`. Daha sonra yalnız `devam` mesajı hiçbir iş başlatmaz.
