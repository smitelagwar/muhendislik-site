import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, LibraryBig, Shield } from "lucide-react";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";

type StandardCard = {
  title: string;
  code: string;
  summary: string;
  whenToOpen: string;
  relatedReading: string;
  href: string;
};

const STANDARDS: StandardCard[] = [
  {
    title: "TBDY 2018",
    code: "Deprem tasarımı",
    summary: "Deprem yer hareketi, performans düzeyi, düzensizlik ve taşıyıcı sistem kararları.",
    whenToOpen: "Yeni proje, güçlendirme veya düzensizlik kontrolü yapılırken.",
    relatedReading: "TBDY, zemin sınıfı ve eşdeğer deprem yükü konularını birlikte açın.",
    href: "/kategori/deprem-yonetmelik?dal=tbdy",
  },
  {
    title: "TS 500",
    code: "Betonarme",
    summary: "Donatı oranı, kenetlenme, kolon-kiriş etkileşimi ve eleman boyutlandırması.",
    whenToOpen: "Donatı, kesit veya detaylandırma kararı verilirken.",
    relatedReading: "Önce TS 500, ardından donatı ve kesit araçlarını açın.",
    href: "/kategori/deprem-yonetmelik?dal=ts500",
  },
  {
    title: "Yangın Yönetmeliği",
    code: "BYY 2015 + 2019",
    summary: "Kaçış yolları, yangına dayanım, algılama, sprinkler ve duman tahliyesi.",
    whenToOpen: "Kullanım sınıfı ve kaçış şartları kontrol edilirken.",
    relatedReading: "Kaçış, dayanım ve özel hacim çözümlerini aynı bakışta okuyun.",
    href: "/kategori/deprem-yonetmelik?dal=yangin",
  },
  {
    title: "İmar Mevzuatı",
    code: "PAİY 2017",
    summary: "TAKS, KAKS, çekme mesafeleri, kat yükseklikleri ve ruhsat akışı.",
    whenToOpen: "Parsel, emsal ve ruhsat koşulları birlikte okunurken.",
    relatedReading: "Plan notu ve uygulama önceliğini kontrol edin.",
    href: "/kategori/deprem-yonetmelik?dal=imar",
  },
  {
    title: "BEP-TR / TS 825",
    code: "Enerji performansı",
    summary: "Isı kaybı, U değeri, yoğuşma, EKB ve ısıl köprüler.",
    whenToOpen: "Cephe ve kabuk performansı değerlendirilirken.",
    relatedReading: "Yalıtım ve yoğuşma kontrolünü birlikte ele alın.",
    href: "/kategori/deprem-yonetmelik?dal=bep",
  },
  {
    title: "TS 9111",
    code: "Engelsiz tasarım",
    summary: "Rampa, koridor, WC ve erişilebilirlik boyutları.",
    whenToOpen: "Ruhsat ve mimari eskiz aşamasında erişilebilirlik kontrolü yapılırken.",
    relatedReading: "Erişilebilirlik boyutlarını ilk eskizde doğrulayın.",
    href: "/kategori/deprem-yonetmelik?dal=engelsiz",
  },
  {
    title: "TS EN Serisi",
    code: "Eurocode",
    summary: "Yük kombinasyonları, kar, rüzgar ve karşılaştırmalı analiz.",
    whenToOpen: "Uluslararası yaklaşım ile TS 500 kıyaslanırken.",
    relatedReading: "Yük kombinasyonlarını ve kısmi güvenlik katsayılarını birlikte okuyun.",
    href: "/kategori/deprem-yonetmelik?dal=eurocode",
  },
  {
    title: "İSG ve Çevre",
    code: "Şantiye yönetimi",
    summary: "Şantiye güvenlik planı, ÇED, atık, toz ve gürültü yükümlülükleri.",
    whenToOpen: "Şantiye kurulumu ve uygulama programı hazırlanırken.",
    relatedReading: "Güvenlik ve çevre koşullarını erken aşamada birleştirin.",
    href: "/kategori/deprem-yonetmelik?dal=isg",
  },
];

const CHECKLISTS = [
  {
    title: "Proje öncesi kontrol",
    items: [
      "Kategori ve alt dal doğru mu?",
      "İlgili standart referansı hazır mı?",
      "Teknik karar için doğru araç seçildi mi?",
    ],
  },
  {
    title: "Makaleyi açmadan önce",
    items: [
      "Başlık ve özet aynı problem alanını anlatıyor mu?",
      "Aradığınız konu için filtre uygulanmış mı?",
      "İlgili araç bağlantısı doğrudan işinizi çözüyor mu?",
    ],
  },
  {
    title: "Saha veya ofis kontrolü",
    items: [
      "Birimler ve sınır değerler doğrulandı mı?",
      "Yönetmelik maddesi ile proje verisi eşleşiyor mu?",
      "Gerekirse plan notu ve uygulama önceliği tekrar okundu mu?",
    ],
  },
] as const;

export default function DepremStandartKutuphanesi() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-none bg-amber-500/15 text-amber-200">Standart Kütüphanesi</Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {STANDARDS.length} hızlı referans
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Yönetmelik Standart Kütüphanesi
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              Hangi standart ne zaman açılır, hangi alt dala bağlanır ve hangi araçla tamamlanır sorusunu tek yerde görün.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Hızlı erişim</p>
            <p className="mt-1 text-lg font-black text-white">Araç Merkezi</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
              Tüm araçlara tek yerden geçmek için genel araç merkezini kullanın.
            </p>
            <Button asChild className="mt-4 h-10 rounded-full bg-white px-5 text-sm font-black text-zinc-950 hover:bg-zinc-100">
              <Link href={TOOLS_HUB_HREF} prefetch={false}>
                Araç merkezini aç
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STANDARDS.map((standard) => (
            <Card key={standard.title} className="overflow-hidden border-zinc-800 bg-zinc-900/80 shadow-sm">
              <div className="h-1 bg-gradient-to-r from-amber-500/60 to-orange-500/40" />
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-black text-white">{standard.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
                      {standard.code}
                    </CardDescription>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-200">
                    <LibraryBig className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-zinc-300">{standard.summary}</p>
                <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Ne zaman açılır?</p>
                  <p className="text-sm leading-6 text-zinc-400">{standard.whenToOpen}</p>
                  <p className="text-sm leading-6 text-zinc-300">{standard.relatedReading}</p>
                </div>
                <Button asChild variant="outline" className="h-10 w-full rounded-full border-zinc-700 bg-zinc-950 text-sm font-black text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white">
                  <Link href={standard.href} prefetch={false}>
                    İlgili alt dala git
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {CHECKLISTS.map((checklist) => (
            <Card key={checklist.title} className="border-zinc-800 bg-zinc-900/70 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-white">{checklist.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-6 text-zinc-400">
                      Makaleyi açmadan önce kısa kontrol listesi.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.items.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm leading-6 text-zinc-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-4 text-sm leading-6 text-zinc-400">
          <Shield className="mb-2 h-4 w-4 text-amber-300" />
          Bu kütüphane, proje kararı yerine geçmez. Yönetmelik maddesi, proje verisi ve yerel koşullar birlikte doğrulanmalıdır.
        </div>
      </div>
    </section>
  );
}
