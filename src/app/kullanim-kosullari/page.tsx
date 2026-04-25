import type { Metadata } from "next";
import { FileText, Scale, ShieldAlert } from "lucide-react";
import { buildSeoMetadata } from "@/lib/seo";

const TERMS = [
  {
    title: "Bilgilendirme Niteliği",
    icon: FileText,
    text: "İnşa Blog üzerindeki yazılar, hesap araçları ve rehberler referans amaçlıdır. Nihai tasarım, proje ve uygulama kararları kullanıcıya ve ilgili uzman ekibe aittir.",
  },
  {
    title: "Mesleki Sorumluluk",
    icon: Scale,
    text: "Araç çıktıları, projeye özel statik analiz, uygulama detayı, saha ölçümü ve yürürlükteki mevzuat ile birlikte değerlendirilmelidir. Tek başına bağlayıcı proje çıktısı olarak kullanılmamalıdır.",
  },
  {
    title: "İçerik ve Güncelleme",
    icon: ShieldAlert,
    text: "Site içeriği sürekli güncellenir; ancak mevzuat değişiklikleri veya saha koşulları nedeniyle her içerik her proje için doğrudan uygun olmayabilir. Kullanıcı, güncel mevzuatı ayrıca doğrulamakla yükümlüdür.",
  },
];

export const metadata: Metadata = buildSeoMetadata({
  title: "Kullanım Koşulları",
  description: "Sitedeki teknik içeriklerin, hesap araçlarının ve rehberlerin kullanım sınırlarını açıklayan yasal metin.",
  pathname: "/kullanim-kosullari",
});

export default function KullanimKosullariPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <div className="mb-12 max-w-3xl">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Yasal metin</p>
        <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
          Kullanım Koşulları
        </h1>
        <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
          Bu sayfa, İnşa Blog üzerindeki içeriklerin ve araçların kullanımına ilişkin temel şartları açıklar.
          Siteyi kullanmaya devam ederek aşağıdaki koşulları kabul etmiş sayılırsınız.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {TERMS.map((item) => {
          const Icon = item.icon;
          return (
            <section
              key={item.title}
              className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-zinc-950 dark:text-white">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{item.text}</p>
            </section>
          );
        })}
      </div>

      <div className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Sorularınız için{" "}
          <a className="font-bold text-blue-600 hover:underline dark:text-blue-400" href="mailto:info@insablog.com">
            info@insablog.com
          </a>{" "}
          adresi üzerinden bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
