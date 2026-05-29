import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Terminal, ShieldAlert } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/ui/button";

export function HomeCtaBanner() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <AnimatedSection animation="fade-up">
        <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-[linear-gradient(135deg,rgba(245,158,11,0.1),rgba(6,8,13,0.96)_40%,rgba(8,145,178,0.12)_100%)] shadow-xl">
          
          {/* Arka plan blueprint çizgileri */}
          <div className="home-grid-backdrop absolute inset-0 opacity-40 pointer-events-none" />
          
          <div className="absolute inset-y-0 right-0 hidden w-[35%] lg:block">
            <Image
              src="/blog-images/engineers_blueprints_1774081432947.png"
              alt="Projeyi birlikte değerlendiren mühendisler"
              fill
              className="object-cover opacity-20 dark:opacity-[0.15]"
              sizes="33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#06080d] via-[#06080d]/40 to-transparent" />
          </div>

          <div className="relative grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:px-10 lg:py-12">
            
            {/* Sol Bölüm: İletişim Form Metinleri */}
            <div className="max-w-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="home-section-kicker">İletişim hattı</span>
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/20">
                    Öneri & Hata Bildirimi
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-800 dark:text-white sm:text-4xl leading-tight">
                  Araç fikri, içerik düzeltmesi veya proje akışı için doğrudan yazın
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-300">
                  Bu portal mühendislerin karar süreçlerini hızlandırmak için kuruldu. Hesap araçlarında 
                  eksik gördüğünüz formülleri, hatalı pas payı detaylarını veya eklenmesini istediğiniz 
                  yeni yönetmelik hesaplarını bize iletin, en kısa sürede yayına alalım.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="home-button-primary py-6 px-6 font-bold uppercase text-xs">
                  <Link href="/iletisim">
                    İletişim sayfasını aç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="home-button-secondary py-6 px-6 font-bold uppercase text-xs">
                  <a href="mailto:info@insablog.com?subject=Muhendislik%20Portali%20Iletisim">
                    E-posta gönder
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Sağ Bölüm: Sistem Terminal Tasarımı */}
            <div className="flex flex-col justify-center">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-950/90 dark:bg-black/80 font-mono overflow-hidden shadow-2xl text-[11px] text-slate-300">
                {/* Terminal Header */}
                <div className="flex items-center justify-between bg-slate-900/90 dark:bg-zinc-900 px-4 py-2 border-b border-slate-850 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="h-3.5 w-3.5 text-amber-500" />
                    <span>terminal_session.sh</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500/40"></span>
                    <span className="h-2 w-2 rounded-full bg-yellow-500/40"></span>
                    <span className="h-2 w-2 rounded-full bg-green-500/40"></span>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-4 space-y-3 leading-relaxed text-slate-400">
                  <div>
                    <span className="text-amber-500">$</span> insablog --listen-proposals
                  </div>
                  <div className="text-emerald-500 font-bold">
                    [OK] Listening on port 443... ready for proposals.
                  </div>
                  <div className="border-t border-white/5 pt-2">
                    <span className="text-slate-500">// Gelen talepler için iş akışı:</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">1.</span>
                    <span>Yeni araçlar için doğrulanmış yönetmelik denklemleri (TS 500 / TBDY).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">2.</span>
                    <span>Varsa yazılım kodundaki yuvarlama veya birim hatalarının bildirimi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">3.</span>
                    <span>Saha pratiklerini geliştirecek yeni kontrol listesi ekleme talepleri.</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                    <span>Güvenlik: Tüm veriler yerel hafızada tutulur.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
