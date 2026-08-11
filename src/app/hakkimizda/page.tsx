import type { Metadata } from "next";
import { Target, Users, Shield } from "lucide-react";
import { SitePageHeader, SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Hakkımızda",
  description: "İnşa Blog’un teknik içerik yaklaşımı, editoryal amacı ve mühendislik odaklı yayın çizgisi.",
  pathname: "/hakkimizda",
});

export default function Hakkimizda() {
  return (
    <SitePageShell width="content">
      <SitePageHeader
        eyebrow="Kurumsal / Editoryal yaklaşım"
        title="Hakkımızda"
        description="Teknik bilgiyi, mühendislik araçlarını ve saha deneyimini sade bir çalışma yüzeyinde bir araya getiriyoruz."
        icon={<Target className="h-6 w-6" />}
      />

      <div className="mt-10 space-y-6">
        <section className="site-panel rounded-xl p-8 md:p-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="m-0 text-3xl font-black tracking-tight">Misyonumuz</h2>
          </div>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            İnşa Blog; inşaat mühendisleri ve mimarlar için teknik bilgiye erişimi kolaylaştırmayı, sahada kullanılabilir araçlar sunmayı ve karmaşık yönetmelikleri daha okunur hale getirmeyi amaçlayan bağımsız bir dijital platformdur.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="site-panel rounded-xl p-8">
            <h3 className="mb-4 flex items-center gap-3 text-xl font-black">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              Topluluk
            </h3>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sektörden profesyonellerin katkılarıyla sürekli büyüyen, pratik ve uygulanabilir bir bilgi havuzu oluşturuyoruz.
            </p>
          </div>
          <div className="site-panel rounded-xl p-8">
            <h3 className="mb-4 flex items-center gap-3 text-xl font-black">
              <Shield className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              Güvenilirlik
            </h3>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              İçeriklerimiz güncel yönetmelikler, saha uygulamaları ve mühendislik yaklaşımı gözetilerek hazırlanır; araçlar ise hızlı karar desteği vermek üzere kurgulanır.
            </p>
          </div>
        </div>
      </div>
    </SitePageShell>
  );
}
