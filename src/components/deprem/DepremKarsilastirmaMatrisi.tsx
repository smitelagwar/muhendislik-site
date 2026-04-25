import Link from "next/link";
import { ArrowRight, BarChart3, Layers3, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEPREM_SERIES, type DepremSeriesDefinition } from "@/lib/deprem-series";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";

type ComparisonRow = {
  seriesId: DepremSeriesDefinition["id"];
  focus: string;
  question: string;
  recommendation: string;
  filterCta: string;
  toolLabel: string;
  toolHref: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    seriesId: "tbdy",
    focus: "Deprem davranışı, spektrum, düzensizlik ve performans hedefleri",
    question: "Bu bina için DD-2 tasarım depremi ve düzensizlik kontrolü nasıl okunmalı?",
    recommendation: "Önce eşdeğer deprem yükünü, sonra düzensizlikleri ve zemin sınıfını kontrol et.",
    filterCta: "TBDY konularını aç",
    toolLabel: "Eşdeğer Deprem Yükü",
    toolHref: "/deprem-yonetmelik/araclar/esit-deprem-yuku",
  },
  {
    seriesId: "ts500",
    focus: "Donatı oranı, kenetlenme, kolon-kiriş-döşeme boyutlandırması",
    question: "Bu kesitte minimum donatı, ek yeri ve kolon moment etkisi yeterli mi?",
    recommendation: "Betonarme kesitleri TS 500 mantığıyla birlikte ön boyutlandır ve donatı alanını doğrula.",
    filterCta: "TS 500 konularını aç",
    toolLabel: "Donatı Hesabı",
    toolHref: "/kategori/araclar/donati-hesabi",
  },
  {
    seriesId: "yangin",
    focus: "Kaçış yolları, yangına dayanım, sprinkler ve duman tahliyesi",
    question: "Kaçış mesafesi ve yangın dayanımı bu kullanım sınıfı için yeterli mi?",
    recommendation: "Yüksek riskli hacimlerde önce kaçış, sonra dayanım ve algılama sistemlerini birlikte değerlendir.",
    filterCta: "Yangın konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
  {
    seriesId: "otopark",
    focus: "Alan hesabı, rampa geometrisi, havalandırma ve şarj altyapısı",
    question: "Bu otopark düzeninde dönüş yarıçapı ve CO tahliyesi yeterli mi?",
    recommendation: "Önce geometriyi, sonra havalandırma ve elektrikli araç altyapısını kontrol et.",
    filterCta: "Otopark konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
  {
    seriesId: "imar",
    focus: "TAKS, KAKS, çekme mesafeleri, kat yükseklikleri ve ruhsat akışı",
    question: "Parsel üzerinde emsal ve çekme koşulları birlikte sağlanıyor mu?",
    recommendation: "Plan notu, tevhid-ifraz ve bodrum/çekme kat koşullarını birlikte oku.",
    filterCta: "İmar konularını aç",
    toolLabel: "İmar Hesaplayıcı",
    toolHref: "/kategori/araclar/imar-hesaplayici",
  },
  {
    seriesId: "bep",
    focus: "Isı kaybı, U değeri, yoğuşma, EKB ve ısıl köprüler",
    question: "Bu dış kabukta ısı kaybı ve yoğuşma riski kabul edilebilir mi?",
    recommendation: "Enerji performansını BEP-TR ve TS 825 akışıyla ön kontrol et.",
    filterCta: "BEP-TR konularını aç",
    toolLabel: "Yalıtım Kalınlığı",
    toolHref: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
  },
  {
    seriesId: "su-zemin",
    focus: "Zemin etüdü, sıvılaşma, zemin-yapı etkileşimi, su yalıtımı ve drenaj",
    question: "Zemin sınıfı, sıvılaşma ve su yalıtımı birlikte hangi riski doğuruyor?",
    recommendation: "Önce zemin etüdünü, sonra su yalıtımı ve drenaj çözümünü birlikte düşün.",
    filterCta: "Su-Zemin konularını aç",
    toolLabel: "Zemin Sınıfı",
    toolHref: "/deprem-yonetmelik/araclar/zemin-sinifi",
  },
  {
    seriesId: "engelsiz",
    focus: "TS 9111, rampa, koridor, WC ve erişilebilirlik boyutları",
    question: "Erişilebilirlik şartları ruhsat aşamasında sağlanıyor mu?",
    recommendation: "Rampa ve dolaşım alanlarını ilk eskizde doğrulamak sonradan revizyonu azaltır.",
    filterCta: "Engelsiz konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
  {
    seriesId: "eurocode",
    focus: "TS EN 1990 / 1991 / 1992 yük kombinasyonları ve kıyaslama",
    question: "Eurocode yük kombinasyonu ile TS 500 yaklaşımı nerede ayrışıyor?",
    recommendation: "Kıyaslama yaparken yük kombinasyonunu, kısmi güvenlik katsayılarını ve malzeme modeli farklarını ayrı oku.",
    filterCta: "Eurocode konularını aç",
    toolLabel: "Taban Kesme Kuvveti",
    toolHref: "/kategori/araclar/taban-kesme-kuvveti",
  },
  {
    seriesId: "akustik",
    focus: "TS EN ISO 12354 ile yalıtım ve gürültü performansı",
    question: "Akustik performans hangi katmanlarda kaybediliyor?",
    recommendation: "İç bölme, döşeme ve cephe detaylarını ses köprüsü açısından birlikte incele.",
    filterCta: "Akustik konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
  {
    seriesId: "asansor",
    focus: "Boşluk boyutlandırma, makine dairesi, bakım ve deprem parkı",
    question: "Asansör yerleşimi ve deprem sırasında güvenli park koşulu sağlanıyor mu?",
    recommendation: "Asansör şaftı, erişim ve bakım şartlarını mimariyle birlikte değerlendir.",
    filterCta: "Asansör konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
  {
    seriesId: "isg",
    focus: "Şantiye güvenlik planı, yüksekte çalışma, kazı ve elektrik güvenliği",
    question: "Şantiye kurgu ve iksa çözümü güvenlik planıyla uyumlu mu?",
    recommendation: "İSG başlıklarını iş programı ve geçici işler tasarımıyla birlikte izle.",
    filterCta: "İSG konularını aç",
    toolLabel: "Kalıp Söküm Süresi",
    toolHref: "/kategori/araclar/kalip-sokum-suresi",
  },
  {
    seriesId: "cevre",
    focus: "ÇED, atık yönetimi, gürültü, toz ve şantiye çevre yükümlülükleri",
    question: "Şantiye çevresel etkileri izin ve uygulama aşamalarında kontrol altında mı?",
    recommendation: "ÇED ve atık yönetimini erken aşamada ele almak sahadaki duruş riskini düşürür.",
    filterCta: "Çevre konularını aç",
    toolLabel: "Araç Merkezi",
    toolHref: TOOLS_HUB_HREF,
  },
];

const FEATURED_TOOL_SETS = [
  {
    title: "Deprem karar çekirdeği",
    description: "TBDY, zemin ve deprem yükü kararlarını ilk geçişte birlikte okuyun.",
    items: [
      { label: "Eşdeğer Deprem Yükü", href: "/deprem-yonetmelik/araclar/esit-deprem-yuku" },
      { label: "Düzensizlik Kontrolü", href: "/deprem-yonetmelik/araclar/duzensizlik-kontrolu" },
      { label: "Zemin Sınıfı", href: "/deprem-yonetmelik/araclar/zemin-sinifi" },
    ],
  },
  {
    title: "Betonarme karar çekirdeği",
    description: "TS 500 içeriklerini uygulamaya bağlayan hızlı araç seti.",
    items: [
      { label: "Donatı Hesabı", href: "/kategori/araclar/donati-hesabi" },
      { label: "Kolon Ön Boyutlandırma", href: "/kategori/araclar/kolon-on-boyutlandirma" },
      { label: "Kiriş Kesiti", href: "/kategori/araclar/kiris-kesiti" },
    ],
  },
  {
    title: "Mevzuat ve enerji çekirdeği",
    description: "İmar, BEP-TR ve TS 825 için hızlı kontrol girişleri.",
    items: [
      { label: "İmar Hesaplayıcı", href: "/kategori/araclar/imar-hesaplayici" },
      { label: "Dış Cephe Yalıtım", href: "/kategori/araclar/dis-cephe-yalitim-kalinligi" },
      { label: "Araç Merkezi", href: TOOLS_HUB_HREF },
    ],
  },
] as const;

function getSeriesMeta(seriesId: DepremSeriesDefinition["id"]) {
  return DEPREM_SERIES.find((series) => series.id === seriesId) ?? DEPREM_SERIES[0];
}

export default function DepremKarsilastirmaMatrisi() {
  return (
    <section className="border-y border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/60 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-none bg-red-600/15 text-red-300">Karşılaştırma Matrisi</Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {COMPARISON_ROWS.length} alt dal
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Yönetmelik Karşılaştırma Matrisi
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
              Hangi konu, hangi yönetmelik içinde geçiyor ve hangi araçla hızla ön kontrol edilir sorusunu tek tabloda görün.
              Böylece TS 500, TBDY, Yangın, İmar, BEP-TR ve destekleyici başlıklar arasında dolaşmak kolaylaşır.
            </p>
          </div>

          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Nasıl kullanılır?</p>
                <p className="mt-1 text-lg font-black text-white">Önce konu, sonra araç</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Önce alt dalı seçin, ardından ilgili araç linki ile hızlı ön kontrol yapın. Detaylı okuma için filtre butonunu kullanın.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/60 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Alt dal</TableHead>
                  <TableHead className="text-zinc-400">Ana odak</TableHead>
                  <TableHead className="text-zinc-400">Karar sorusu</TableHead>
                  <TableHead className="text-zinc-400">Önerilen araç</TableHead>
                  <TableHead className="text-right text-zinc-400">Hızlı erişim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON_ROWS.map((row) => {
                  const series = getSeriesMeta(row.seriesId);

                  return (
                    <TableRow key={row.seriesId} className="border-zinc-800 hover:bg-zinc-800/30">
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2">
                          <Badge className="w-fit border-none bg-white/10 text-white">{series.label}</Badge>
                          <p className="max-w-[240px] text-sm leading-6 text-zinc-400">{series.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm leading-6 text-zinc-300">
                        {row.focus}
                      </TableCell>
                      <TableCell className="align-top text-sm leading-6 text-zinc-300">
                        {row.question}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2">
                          <Badge variant="outline" className="w-fit border-zinc-700 text-zinc-300">
                            {row.toolLabel}
                          </Badge>
                          <p className="text-sm leading-6 text-zinc-400">{row.recommendation}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col items-end gap-2">
                          <Button asChild size="sm" className="h-9 rounded-full bg-white px-4 text-xs font-black text-zinc-950 hover:bg-zinc-100">
                            <Link href={`/kategori/deprem-yonetmelik?dal=${row.seriesId}`} prefetch={false}>
                              {row.filterCta}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="h-9 rounded-full border-zinc-700 bg-zinc-950 px-4 text-xs font-black text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white">
                            <Link href={row.toolHref} prefetch={false}>
                              Araç aç
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {FEATURED_TOOL_SETS.map((set) => (
            <Card key={set.title} className="border-zinc-800 bg-zinc-900/80 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-white">{set.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-6 text-zinc-400">
                      {set.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {set.items.map((item) => (
                  <Button
                    key={item.label}
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full border-zinc-700 bg-zinc-950 px-4 text-xs font-black text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
                  >
                    <Link href={item.href} prefetch={false}>
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-5 py-4 text-sm leading-6 text-zinc-400">
          <Wand2 className="mb-2 h-4 w-4 text-red-300" />
          Bu matris, yönetmelik okumasını araçlarla eşleştiren bir ön kontrol katmanıdır. Nihai proje kararı için ilgili standart maddesi ve proje özel koşulları ayrıca doğrulanmalıdır.
        </div>
      </div>
    </section>
  );
}
