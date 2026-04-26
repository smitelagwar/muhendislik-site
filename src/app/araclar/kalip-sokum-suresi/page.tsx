"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Clock3, Info, TestTube2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CEMENT_FACTORS = {
  cem1r: { label: "CEM I 42.5 R", multiplier: 1.0 },
  cem2: { label: "CEM II 32.5", multiplier: 1.35 },
  cem3: { label: "CEM III", multiplier: 1.9 },
} as const;

const ELEMENTS = {
  kolon: { label: "Kolon / Perde yan kalıbı", baseDays: 2, ratio: 0.35 },
  dosemeKucuk: { label: "Döşeme ≤ 4 m", baseDays: 7, ratio: 0.7 },
  dosemeOrta: { label: "Döşeme 4 - 6 m", baseDays: 10, ratio: 0.7 },
  dosemeBuyuk: { label: "Döşeme ≥ 6 m", baseDays: 14, ratio: 0.75 },
  kiris: { label: "Kiriş alt kalıbı", baseDays: 10, ratio: 0.75 },
  konsol: { label: "Konsol", baseDays: 14, ratio: 0.8 },
} as const;

function getTemperatureFactor(temperature: number) {
  if (temperature < 5) return 999;
  if (temperature < 10) return 1.5;
  if (temperature < 15) return 1.25;
  if (temperature <= 25) return 1;
  return 0.85;
}

export default function KalipSokumHesapPage() {
  const [betonSinifi, setBetonSinifi] = useState("25");
  const [cimentoTipi, setCimentoTipi] = useState<keyof typeof CEMENT_FACTORS>("cem1r");
  const [sicaklik, setSicaklik] = useState("20");
  const [elemanTipi, setElemanTipi] = useState<keyof typeof ELEMENTS>("dosemeKucuk");

  const result = useMemo(() => {
    const fck = Number(betonSinifi);
    const temperature = Number(sicaklik);
    const cement = CEMENT_FACTORS[cimentoTipi];
    const element = ELEMENTS[elemanTipi];

    if (![fck, temperature].every((value) => Number.isFinite(value))) {
      return null;
    }

    const temperatureFactor = getTemperatureFactor(temperature);
    const critical = temperatureFactor >= 999;
    const minimumDays = critical ? null : Math.ceil(element.baseDays * cement.multiplier * temperatureFactor);
    const safeDays = critical ? null : Math.ceil((minimumDays ?? 0) * 1.25);
    const targetStrength = fck * element.ratio;

    const notes = [
      "Kesin karar için 7 günlük küp numune veya karot sonucu esas alınmalıdır.",
      elemanTipi === "konsol" ? "Konsollarda erken söküm yerine %80 dayanım ve kademeli söküm tercih edilmelidir." : "Yatay elemanlarda askı payandası bırakmak riski düşürür.",
      cimentoTipi === "cem3" ? "CEM III ile erken söküm ciddi risk taşır; programı daha korumacı kurun." : "Çimento tipi hızlandıkça bekleme süresi kısalabilir, ancak saha kürü ihmal edilmemelidir.",
      temperature < 10 ? "Soğuk havada kalıp sökümünü takvimle değil dayanım doğrulamasıyla yönetin." : "Sıcak havada dayanım erken gelse bile rötre ve çatlak riskine karşı kürlemeyi sürdürün.",
    ];

    return {
      critical,
      minimumDays,
      safeDays,
      targetStrength,
      notes,
      ratioLabel: `%${Math.round(element.ratio * 100)}`,
    };
  }, [betonSinifi, cimentoTipi, elemanTipi, sicaklik]);

  return (
    <div className="tool-page-shell py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
        />

        <div className="mb-10 max-w-3xl">
          <Badge className="mb-4 rounded-full bg-emerald-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
            Şantiye aracı
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">Kalıp söküm süresi</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">Çimento tipi, ortam sıcaklığı ve yapı elemanına göre güvenli söküm gününü tahmini olarak görün. Araç, saha kararını hızlandırmak için ön değerlendirme sunar.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="tool-panel rounded-[28px] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Girdi bilgileri</p>
                <h2 className="text-2xl font-black text-zinc-950 dark:text-white">Senaryoyu tanımlayın</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Beton sınıfı</label>
                <Select value={betonSinifi} onValueChange={setBetonSinifi}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">C25/30</SelectItem>
                    <SelectItem value="30">C30/37</SelectItem>
                    <SelectItem value="35">C35/45</SelectItem>
                    <SelectItem value="40">C40/50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Çimento tipi</label>
                <Select value={cimentoTipi} onValueChange={(value) => setCimentoTipi(value as keyof typeof CEMENT_FACTORS)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CEMENT_FACTORS).map(([key, cement]) => (
                      <SelectItem key={key} value={key}>
                        {cement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Yapı elemanı</label>
                <Select value={elemanTipi} onValueChange={(value) => setElemanTipi(value as keyof typeof ELEMENTS)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ELEMENTS).map(([key, element]) => (
                      <SelectItem key={key} value={key}>
                        {element.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Ortalama sıcaklık (°C)</label>
                <Input value={sicaklik} onChange={(event) => setSicaklik(event.target.value)} inputMode="decimal" />
              </div>
            </div>

            <div className="tool-note mt-6 rounded-2xl p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">Bu araç ön tahmin üretir. Kalıp sökümünde numune sonucu, kür şartı ve üst kat yükleme planı birlikte değerlendirilmelidir.</p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="tool-result-panel overflow-hidden rounded-[28px] p-6 text-white">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-emerald-200">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200/70">Tahmini sonuç</p>
                  <h2 className="text-2xl font-black">Bekleme süresi</h2>
                </div>
              </div>

              {result?.critical ? (
                <>
                  <p className="text-4xl font-black tracking-tight text-red-300 md:text-5xl">Söküm önerilmez</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">5 °C altındaki koşullarda don riski nedeniyle takvim bazlı söküm kararı alınmamalıdır.</p>
                </>
              ) : (
                <>
                  <p className="text-5xl font-black tracking-tight text-white md:text-6xl">{result?.minimumDays} gün</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">Minimum söküm eşiği. Daha güvenli program için <strong>{result?.safeDays} gün</strong> bekleme önerilir.</p>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Hedef dayanım</p>
                <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">{result ? result.targetStrength.toFixed(1) : "-"}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">MPa</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Eşik oranı</p>
                <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">{result?.ratioLabel ?? "-"}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">fck seviyesi</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Sıcaklık etkisi</p>
                <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">{Number(sicaklik)}°</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">ortalama ortam</p>
              </div>
            </div>

            <div className="tool-panel rounded-[28px] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Notlar</p>
                  <h2 className="text-2xl font-black text-zinc-950 dark:text-white">Saha kontrol özeti</h2>
                </div>
              </div>

              <ul className="space-y-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {result?.notes.map((note) => (
                  <li key={note} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <TestTube2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Kritik karar notu
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Numune yoksa kalıp söküm kararı da yok. Bu araç yalnızca ilk programı kurmak için kullanılmalıdır.</p>
              </div>

              <Button asChild variant="outline" className="mt-6 rounded-full">
                <Link href="/kalip-sokumu-rehberi">Kalıp sökümü rehberini aç</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
