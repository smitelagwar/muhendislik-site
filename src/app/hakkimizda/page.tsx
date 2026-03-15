import { Target, Users, Shield } from "lucide-react";

export default function Hakkimizda() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <h1 className="mb-12 text-4xl font-black tracking-tight text-zinc-900 dark:text-white md:text-5xl">Hakkımızda</h1>

      <div className="space-y-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/30">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="m-0 text-3xl font-black tracking-tight">Misyonumuz</h2>
          </div>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">İnşa Blog; inşaat mühendisleri ve mimarlar için teknik bilgiye erişimi kolaylaştırmayı, sahada kullanılabilir araçlar sunmayı ve karmaşık yönetmelikleri daha okunur hale getirmeyi amaçlayan bağımsız bir dijital platformdur.</p>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-100/50 p-8 transition-all hover:border-blue-500/30 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="mb-4 flex items-center gap-3 text-xl font-black">
              <Users className="h-6 w-6 text-blue-600" />
              Topluluk
            </h3>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">Sektörden profesyonellerin katkılarıyla sürekli büyüyen, pratik ve uygulanabilir bir bilgi havuzu oluşturuyoruz.</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-100/50 p-8 transition-all hover:border-blue-500/30 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="mb-4 flex items-center gap-3 text-xl font-black">
              <Shield className="h-6 w-6 text-blue-600" />
              Güvenilirlik
            </h3>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">İçeriklerimiz güncel yönetmelikler, saha uygulamaları ve mühendislik yaklaşımı gözetilerek hazırlanır; araçlar ise hızlı karar desteği vermek üzere kurgulanır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
