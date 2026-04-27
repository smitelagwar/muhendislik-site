import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, SquareTerminal } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/ui/button";

export function HomeCtaBanner() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <AnimatedSection animation="fade-up">
        <div className="relative isolate overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(6,8,13,0.95)_38%,rgba(8,145,178,0.2)_100%)]">
          <div className="home-grid-backdrop absolute inset-0 opacity-60" />
          <div className="absolute inset-y-0 right-0 hidden w-[38%] lg:block">
            <Image
              src="/blog-images/engineers_blueprints_1774081432947.png"
              alt="Projeyi birlikte değerlendiren mühendisler"
              fill
              className="object-cover opacity-30"
              sizes="32vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#06080d] via-[#06080d]/35 to-transparent" />
          </div>

          <div className="relative grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:px-10 lg:py-10">
            <div className="max-w-3xl">
              <p className="home-section-kicker">İletişim hattı</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Araç fikri, içerik düzeltmesi veya proje akışı için doğrudan yazın
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-200">
                Ana yüzey gösterişli görünmek için değil, gerçek kullanımı hızlandırmak için kuruldu. Eksik gördüğünüz
                akışları sahadan gelen ihtiyaç gibi ele alırız.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="home-button-primary">
                  <Link href="/iletisim">
                    İletişim sayfasını aç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="home-button-secondary">
                  <a href="mailto:info@insablog.com?subject=Muhendislik%20Portali%20Iletisim">
                    E-posta gönder
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                  <SquareTerminal className="h-4 w-4 text-amber-300" />
                  Beklenen çıktı
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                  <li>Yeni araç önerileri için net iş akışı tanımı</li>
                  <li>İçerik hataları için düzeltme ve kaynak notu</li>
                  <li>Gerçek kullanım senaryosuna göre UX iyileştirme</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
