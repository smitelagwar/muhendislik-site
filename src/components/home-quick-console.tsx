"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Activity, BookOpen, Layers, CheckCircle2, Info } from "lucide-react";
import type { HomeArticle } from "@/components/home-types";

interface HomeQuickConsoleProps {
  featuredArticle: HomeArticle;
}

// Birim dönüştürme kategorileri ve katsayıları
type ConvCat = "stress" | "force" | "area";

interface ConversionItem {
  name: string;
  from: string;
  to: string;
  factor: number;
  desc: string;
}

const CONVERSIONS: Record<ConvCat, ConversionItem[]> = {
  stress: [
    { name: "MPa → kgf/cm²", from: "MPa", to: "kgf/cm²", factor: 10.19716, desc: "Beton ve çelik dayanımı dönüşümü" },
    { name: "kgf/cm² → MPa", from: "kgf/cm²", to: "MPa", factor: 0.0980665, desc: "Zemin emniyet veya eski mukavemet dönüşümü" },
    { name: "MPa → psi", from: "MPa", to: "psi", factor: 145.038, desc: "Uluslararası şartname dönüştürme" }
  ],
  force: [
    { name: "kN → tf (Ton-kuvvet)", from: "kN", to: "tf", factor: 0.10197, desc: "Düşey yük ve kesme kuvveti dönüşümü" },
    { name: "tf → kN", from: "tf", to: "kN", factor: 9.80665, desc: "Hesap akslarında yük dönüşümü" },
    { name: "kN → kgf", from: "kN", to: "kgf", factor: 101.972, desc: "Küçük ölçekli kuvvet kontrolleri" }
  ],
  area: [
    { name: "cm² → mm²", from: "cm²", to: "mm²", factor: 100, desc: "Donatı enkesit alanı detaylandırması" },
    { name: "m² → cm²", from: "m²", to: "cm²", factor: 10000, desc: "Yapısal eleman kesit alanı" }
  ]
};

const CAT_LABELS: Record<ConvCat, string> = {
  stress: "Gerilme (MPa)",
  force: "Kuvvet (kN)",
  area: "Alan (cm²)"
};

// Donatı çapları listesi (TS 500 standardı)
const REBAR_DIAMETERS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 28, 30, 32];

export function HomeQuickConsole({ featuredArticle }: HomeQuickConsoleProps) {
  const [activeTab, setActiveTab] = useState<"converter" | "rebar" | "guide">("converter");

  // Birim Çevirici State
  const [convCat, setConvCat] = useState<ConvCat>("stress");
  const [selectedConvIdx, setSelectedConvIdx] = useState(0);
  const [convInput, setConvInput] = useState("");

  const currentConv = CONVERSIONS[convCat][selectedConvIdx] || CONVERSIONS[convCat][0];

  const convResult = useMemo(() => {
    if (!convInput) return "";
    const parsed = Number(convInput.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) return "Geçersiz değer";
    return (parsed * currentConv.factor).toLocaleString("tr-TR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });
  }, [convInput, currentConv]);

  // Donatı Hesaplayıcı State
  const [rebarMode, setRebarMode] = useState<"spacing" | "quantity">("spacing");
  const [rebarDia, setRebarDia] = useState(12); // Varsayılan Φ12
  const [rebarSpacing, setRebarSpacing] = useState("15"); // Varsayılan 15 cm
  const [rebarQty, setRebarQty] = useState("5"); // Varsayılan 5 adet

  const rebarResult = useMemo(() => {
    const d = rebarDia;
    const barArea = (Math.PI * Math.pow(d, 2)) / 400; // cm² cinsinden tek çubuğun alanı

    if (rebarMode === "spacing") {
      const s = Number(rebarSpacing);
      if (isNaN(s) || s <= 0) return { area: 0, desc: "Aralık değeri girin" };
      // 1 metredeki donatı alanı: As = (100 / s) * barArea
      const area = (100 / s) * barArea;
      return {
        area,
        unit: "cm²/m",
        desc: `1 metre boyda Φ${d}/${s} yerleşimi`
      };
    } else {
      const n = Number(rebarQty);
      if (isNaN(n) || n <= 0) return { area: 0, desc: "Adet girin" };
      const area = n * barArea;
      return {
        area,
        unit: "cm²",
        desc: `${n} adet Φ${d} toplam donatı alanı`
      };
    }
  }, [rebarMode, rebarDia, rebarSpacing, rebarQty]);

  // Hızlı kontrol etiketleri (Donatı alanı değerlendirmesi)
  const rebarEvaluation = useMemo(() => {
    const area = rebarResult.area;
    if (area <= 0) return null;

    if (rebarMode === "spacing") {
      if (area < 1.5) return { text: "Döşemeler için kritik düşük alan", status: "warn" };
      if (area >= 1.5 && area < 4.0) return { text: "Hafif yüklü döşeme / hasır donatı aralığı", status: "ok" };
      return { text: "Yapısal döşeme veya radye temel donatısı", status: "strong" };
    } else {
      if (area < 2.0) return { text: "Minimum kiriş montaj veya gövde donatısı", status: "warn" };
      if (area >= 2.0 && area < 8.0) return { text: "Standart kiriş boyuna veya kolon çiroz donatısı", status: "ok" };
      return { text: "Ana taşıyıcı boyuna donatı grubu", status: "strong" };
    }
  }, [rebarResult, rebarMode]);

  return (
    <div className="home-glass-panel relative flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
      {/* Konsol Üst Şeridi */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Engine Console v1.2
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/30"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/30"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/30"></span>
        </div>
      </div>

      {/* Sekmeler (Tab Headers) */}
      <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 font-semibold text-xs text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab("converter")}
          className={`flex items-center justify-center gap-1.5 py-3 transition-colors ${
            activeTab === "converter"
              ? "bg-white dark:bg-[#06080d] text-amber-600 dark:text-amber-300 border-b border-amber-500"
              : "hover:bg-slate-200/50 dark:hover:bg-white/5"
          }`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>Çevirici</span>
        </button>
        <button
          onClick={() => setActiveTab("rebar")}
          className={`flex items-center justify-center gap-1.5 py-3 transition-colors ${
            activeTab === "rebar"
              ? "bg-white dark:bg-[#06080d] text-amber-600 dark:text-amber-300 border-b border-amber-500"
              : "hover:bg-slate-200/50 dark:hover:bg-white/5"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Donatı</span>
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          className={`flex items-center justify-center gap-1.5 py-3 transition-colors ${
            activeTab === "guide"
              ? "bg-white dark:bg-[#06080d] text-amber-600 dark:text-amber-300 border-b border-amber-500"
              : "hover:bg-slate-200/50 dark:hover:bg-white/5"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Öne Çıkan</span>
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div className="p-5 flex-1 min-h-[19.5rem] flex flex-col justify-between bg-white/40 dark:bg-transparent">
        <AnimatePresence mode="wait">
          {activeTab === "converter" && (
            <motion.div
              key="converter"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Birim Kategorileri */}
              <div className="flex gap-1 border-b border-slate-200 dark:border-white/5 pb-2">
                {(Object.keys(CONVERSIONS) as ConvCat[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setConvCat(cat);
                      setSelectedConvIdx(0);
                      setConvInput("");
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                      convCat === cat
                        ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {CAT_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Seçilen Çeviri Yönü */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dönüşüm Yönü</label>
                <select
                  value={selectedConvIdx}
                  onChange={(e) => {
                    setSelectedConvIdx(Number(e.target.value));
                    setConvInput("");
                  }}
                  className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                >
                  {CONVERSIONS[convCat].map((item, idx) => (
                    <option key={item.name} value={idx} className="bg-white dark:bg-[#0c1222]">
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-slate-400 italic">
                  {currentConv.desc}
                </span>
              </div>

              {/* Input & Output */}
              <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 pt-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Giriş ({currentConv.from})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={convInput}
                    onChange={(e) => setConvInput(e.target.value)}
                    placeholder="Değer..."
                    className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2.5 font-mono text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex justify-center pt-4">
                  <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sonuç ({currentConv.to})
                  </label>
                  <div className="min-h-[38px] flex items-center justify-end rounded-md border border-amber-500/20 bg-amber-500/5 dark:bg-amber-400/5 px-3 py-2 text-right font-mono text-sm font-black text-amber-600 dark:text-amber-300">
                    {convResult || "0.000"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "rebar" && (
            <motion.div
              key="rebar"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Hesaplama Türü */}
              <div className="flex gap-1 border-b border-slate-200 dark:border-white/5 pb-2">
                <button
                  onClick={() => setRebarMode("spacing")}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                    rebarMode === "spacing"
                      ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  Metraj / Aralık Bazlı
                </button>
                <button
                  onClick={() => setRebarMode("quantity")}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                    rebarMode === "quantity"
                      ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  Kiriş/Kolon Adet Bazlı
                </button>
              </div>

              {/* Parametre Girişleri */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Çap (Φ, mm)</label>
                  <select
                    value={rebarDia}
                    onChange={(e) => setRebarDia(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-amber-400"
                  >
                    {REBAR_DIAMETERS.map((dia) => (
                      <option key={dia} value={dia} className="bg-white dark:bg-[#0c1222]">
                        Φ{dia}
                      </option>
                    ))}
                  </select>
                </div>

                {rebarMode === "spacing" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aralık (cm)</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={rebarSpacing}
                      onChange={(e) => setRebarSpacing(e.target.value)}
                      placeholder="örn. 15"
                      className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adet</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={rebarQty}
                      onChange={(e) => setRebarQty(e.target.value)}
                      placeholder="örn. 5"
                      className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Çıktı & Değerlendirme */}
              <div className="rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{rebarResult.desc}</span>
                  <div className="font-mono text-lg font-black text-amber-500 dark:text-amber-300">
                    {rebarResult.area.toFixed(2)} <span className="text-xs font-normal">{rebarResult.unit}</span>
                  </div>
                </div>

                {rebarEvaluation && (
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 dark:border-white/5 pt-2 text-[11px]">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${
                      rebarEvaluation.status === "warn"
                        ? "text-yellow-500"
                        : rebarEvaluation.status === "strong"
                        ? "text-cyan-500"
                        : "text-emerald-500"
                    }`} />
                    <span className="text-slate-500 dark:text-slate-300">{rebarEvaluation.text}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 flex flex-col justify-between h-full"
            >
              <div className="flex gap-4">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-white/10">
                  <Image
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="rounded bg-amber-500/10 dark:bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                    {featuredArticle.category}
                  </span>
                  <h4 className="line-clamp-2 text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {featuredArticle.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Okuma süresi: {featuredArticle.readTime}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-white/5 p-2.5 rounded-lg">
                {featuredArticle.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Konsol Alt Butonu */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            TS 500 & TBDY Uyumlu
          </span>
          {activeTab === "guide" ? (
            <Link
              href={`/${featuredArticle.slug}`}
              className="inline-flex items-center gap-1 rounded bg-amber-500 dark:bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-amber-600 dark:hover:bg-amber-300 transition-colors"
            >
              Rehberi Oku
            </Link>
          ) : activeTab === "rebar" ? (
            <Link
              href="/kategori/araclar/donati-hesabi"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
            >
              Detaylı Çelik Hesabı →
            </Link>
          ) : (
            <Link
              href="/kategori/araclar"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
            >
              Tüm Mühendislik Araçları →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
