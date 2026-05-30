import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Terminal, ShieldAlert, Zap, BookOpen, BarChart3 } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/ui/button";

// Sabit mini istatistikler
const MINI_STATS = [
  { icon: Zap, label: "Anlık hesap", value: "9+", desc: "Farklı mesleki hesap modülü" },
  { icon: BookOpen, label: "Teknik kaynak", value: "108+", desc: "Makale, rehber ve mevzuat özeti" },
  { icon: BarChart3, label: "Standart referans", value: "4", desc: "TS500, TBDY 2018, EC2, TS EN 206" },
];

export function HomeCtaBanner() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <AnimatedSection animation="fade-up">
        <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200 dark:border-white/8 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(6,8,13,0.97)_38%,rgba(8,145,178,0.15)_100%)] shadow-xl shadow-slate-900/30">
          
          {/* Arka plan blueprint çizgileri */}
          <div className="home-grid-backdrop absolute inset-0 opacity-30 pointer-events-none" />
          {/* Ambient glow */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />
          
          <div className="absolute inset-y-0 right-0 hidden w-[35%] lg:block">
            <Image
              src="/blog-images/engineers_blueprints_1774081432947.png"
              alt="Projeyi birlikte değlendiren mühendisler"
              fill
              className="object-cover opacity-[0.12] dark:opacity-[0.1]"
              sizes="33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#06080d] via-[#06080d]/50 to-transparent" />
          </div>

          <div className="relative grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:px-10 lg:py-12">
            
            {/* Sol Bölüm: İletişim Form Metinleri */}
            <div className="max-w-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="home-section-kicker">İletişim hattı</span>
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/20">
                    Öneri &amp; Hata Bildirimi
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

                {/* Mini istatistikler */}
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  {MINI_STATS.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <stat.icon className="h-3 w-3 text-amber-500" />
                        {stat.label}
                      </div>
                      <div className="font-mono text-2xl font-black text-white tracking-tight">{stat.value}</div>
                      <p className="text-[10px] text-slate-500 leading-4">{stat.desc}</p>
                    </div>
                  ))}
                </div>
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

            {/* Sağ Bölüm: Sistem Terminal Tasarımı — sadece masaüstünde */}
            <div className="hidden lg:flex flex-col justify-center">
              <div className="rounded-xl border border-slate-700/80 dark:border-white/10 bg-[#0a0f1a] font-mono overflow-hidden shadow-2xl text-[11px] text-slate-300">
                {/* Terminal Header */}
                <div className="flex items-center justify-between bg-[#111827] px-4 py-2.5 border-b border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-slate-300">terminal_session.sh</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/60"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/60"></span>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-5 space-y-3 leading-relaxed text-slate-400">
                  <div>
                    <span className="text-amber-400">$</span> <span className="text-slate-200">insablog --listen-proposals</span>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    [OK] Listening on port 443... ready for proposals.
                  </div>
                  <div className="border-t border-white/5 pt-2">
                    <span className="text-slate-600">// Gelen talepler için iş akışı:</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">1.</span>
                    <span className="text-slate-300">Yeni araçlar için doğrulanmış yönetmelik denklemleri (TS 500 / TBDY).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">2.</span>
                    <span className="text-slate-300">Varsa yazılım kodundaki yuvarlama veya birim hatalarının bildirimi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">3.</span>
                    <span className="text-slate-300">Saha pratiklerini geliştirecek yeni kontrol listesi ekleme talepleri.</span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex items-center gap-2">
                    <span className="text-amber-400">$</span>
                    <span className="text-slate-200">_</span>
                    <span className="inline-block h-3.5 w-0.5 bg-amber-400 animate-pulse" />
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
