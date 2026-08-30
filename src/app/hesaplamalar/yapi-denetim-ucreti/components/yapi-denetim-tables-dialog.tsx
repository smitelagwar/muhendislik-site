"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Building,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Layers,
  MapPin,
  Percent,
  Receipt,
  Scale,
  ShieldAlert,
} from "lucide-react";
import {
  INSPECTION_CLASS_GROUP_OPTIONS,
  INSTALLMENT_STAGES,
  REGIONAL_DISCOUNT_OPTIONS,
  YAPI_DENETIM_EFFECTIVE_YEAR,
  YAPI_DENETIM_RATE_TABLE,
  YAPI_DENETIM_SOURCE_METADATA,
} from "@/lib/calculations/modules/yapi-denetim-ucreti";
import { formatCurrencyTL2, formatSayi } from "@/lib/calculations/core";

interface YapiDenetimTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabKey = "rates" | "unitCosts" | "discounts" | "installments" | "notes";

export function YapiDenetimTablesContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("rates");

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-6 pb-4 border-b border-border/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Scale className="h-4 w-4" />
          <span>4708 Sayılı Mevzuat ve 2026 Verileri</span>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-foreground dark:text-white mt-1">
          2026 Yapı Denetimi Tabloları ve Kuralları
        </h3>
        <p id="yapi-denetim-dialog-desc" className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
          Yapı Denetimi Uygulama Yönetmeliği Madde 26-27 uyarınca uygulanan hizmet bedeli oranları, birim maliyetler ve yasal indirim cetvelleri.
        </p>

        {/* Sekme Butonları */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            data-testid="tab-rates"
            onClick={() => setActiveTab("rates")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "rates"
                ? "bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted dark:text-slate-400 dark:hover:bg-white/5"
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
            Hizmet Oranları Cetveli
          </button>
          <button
            type="button"
            data-testid="tab-unit-costs"
            onClick={() => setActiveTab("unitCosts")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "unitCosts"
                ? "bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted dark:text-slate-400 dark:hover:bg-white/5"
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            2026 Birim Maliyetler
          </button>
          <button
            type="button"
            data-testid="tab-discounts"
            onClick={() => setActiveTab("discounts")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "discounts"
                ? "bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted dark:text-slate-400 dark:hover:bg-white/5"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Bölgesel İndirimler
          </button>
          <button
            type="button"
            data-testid="tab-installments"
            onClick={() => setActiveTab("installments")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "installments"
                ? "bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted dark:text-slate-400 dark:hover:bg-white/5"
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Hakediş / Ödeme
          </button>
          <button
            type="button"
            data-testid="tab-notes"
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:bg-muted dark:text-slate-400 dark:hover:bg-white/5"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Mevzuat Notları
          </button>
        </div>
      </div>

      {/* Sekme İçeriği (Kaydırılabilir) */}
      <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-foreground dark:text-slate-300">
        {/* TAB 1: Hizmet Bedeli Oranları Cetveli */}
        {activeTab === "rates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-foreground dark:text-white">
                Hizmet Bedeline Esas Oran Cetveli (Madde 26 / Ek Cetvel)
              </h4>
              <span className="text-[11px] text-muted-foreground">Katsayılar mevzuatta sabittir</span>
            </div>
            <p className="text-muted-foreground dark:text-slate-400">
              Yapı denetim hizmet bedeli oranı; yapının denetime esas toplam inşaat alanı ve ruhsat
              öngörülen yapım süresine göre aşağıdaki cetvelden belirlenir:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-border/80 dark:border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/50 dark:border-white/10 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    <th className="p-3">Öngörülen Süre</th>
                    <th className="p-3">A ≤ 1.000 m²</th>
                    <th className="p-3">1.000 &lt; A ≤ 50.000 m²</th>
                    <th className="p-3">A &gt; 50.000 m²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-white/5 font-mono">
                  {([1, 2, 3, 4, 5] as const).map((years) => {
                    const row = YAPI_DENETIM_RATE_TABLE[years];
                    return (
                      <tr key={years} className="hover:bg-muted/30 dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-sans font-bold text-foreground dark:text-white">
                          {years} Yıl
                        </td>
                        <td className="p-3 text-amber-700 dark:text-amber-300 font-bold">
                          %{(row.upTo1000 * 100).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="p-3 text-amber-700 dark:text-amber-300 font-bold">
                          %{(row.from1000To50000 * 100).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="p-3 text-amber-700 dark:text-amber-300 font-bold">
                          %{(row.over50000 * 100).toFixed(2).replace(".", ",")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 dark:border-white/5 dark:bg-white/[0.02] text-[11px] space-y-1">
              <p className="font-bold text-foreground dark:text-white">Önemli Sınır Kuralları:</p>
              <p>• <strong>1.000,00 m²</strong> birinci banttır; <strong>1.000,01 m²</strong> orta banta geçer.</p>
              <p>• <strong>50.000,00 m²</strong> orta banttır; <strong>50.000,01 m²</strong> üçüncü banta geçer.</p>
              <p>• <strong>500 m² ve altındaki yapılarda</strong> hizmet bedeli oranı sözleşmeyle azami <strong>%3,50</strong>&apos;ye kadar artırılabilir.</p>
            </div>
          </div>
        )}

        {/* TAB 2: 2026 Birim Maliyetler */}
        {activeTab === "unitCosts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-foreground dark:text-white">
                2026 Yılı Yapı Denetimi Birim Maliyetleri
              </h4>
              <span className="text-[11px] text-muted-foreground font-mono">2026 Yılı Değerleri</span>
            </div>
            <p className="text-muted-foreground dark:text-slate-400">
              Yapı denetim birim maliyeti, Çevre ve Şehircilik Bakanlığı mimarlık yaklaşık maliyetlerinden
              farklı olarak 3 ana denetim grubu bazında yayımlanır. 2025 yılı tabanları 2025 yılı Aralık ayı
              Yİ-ÜFE (%27,67) ve TÜFE (%30,89) yıllık değişim ortalaması olan <strong>%29,28</strong> ile
              güncellenmiştir:
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {INSPECTION_CLASS_GROUP_OPTIONS.map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-border/80 bg-muted/30 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.groupCode}
                  </div>
                  <div className="mt-1 text-base font-extrabold text-foreground dark:text-white">
                    {group.title}
                  </div>
                  <div className="mt-2 text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                    {formatSayi(group.unitCostTL)} TL/m²
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    {group.description}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border/60 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Kapsanan Resmî Sınıflar:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {group.officialClasses.map((cls) => (
                        <span
                          key={cls}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono dark:bg-white/10"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Bölgesel İndirimler */}
        {activeTab === "discounts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-foreground dark:text-white">
                Bölgesel İndirim Oranları (Yönetmelik Madde 26/8)
              </h4>
              <span className="text-[11px] text-muted-foreground">Yasal İndirim Cetveli</span>
            </div>
            <p className="text-muted-foreground dark:text-slate-400">
              Yapı denetim hizmet bedelinde uygulanacak yasal indirim oranları, yapının bulunduğu özel
              bölge statüsüne göre belirlenmiştir:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-border/80 dark:border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/50 dark:border-white/10 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    <th className="p-3">Bölge Türü</th>
                    <th className="p-3">Uygulanacak İndirim</th>
                    <th className="p-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-white/5">
                  {REGIONAL_DISCOUNT_OPTIONS.map((reg) => (
                    <tr key={reg.id} className="hover:bg-muted/30 dark:hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-foreground dark:text-white">
                        {reg.label}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {reg.percentText}
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground dark:text-slate-400">
                        {reg.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 dark:border-white/5 dark:bg-white/[0.02] text-[11px]">
              <strong>Not:</strong> Kanundaki &quot;%50&apos;yi geçmemek üzere&quot; ifadesi somut bir hesap oranı değil,
              Bakanlar Kurulu/Cumhurbaşkanlığı düzenleme üst sınırıdır. Bu hesaplayıcıda yönetmelikte
              yayımlanmış fiili oranlar (%20 ve %35) kullanılır.
            </div>
          </div>
        )}

        {/* TAB 4: Hakediş / Ödeme */}
        {activeTab === "installments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-foreground dark:text-white">
                Hakediş ve Ödeme Esasları (Yönetmelik Madde 27)
              </h4>
              <span className="text-[11px] text-muted-foreground font-mono">6 Standart Etap</span>
            </div>
            <p className="text-muted-foreground dark:text-slate-400">
              Hizmet bedelinin ödenmesi, toplam inşaat alanına göre defaten veya taksitler halinde gerçekleştirilir:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-extrabold text-foreground dark:text-white">
                  Toplam Alan ≤ 3.000 m²
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Yapı denetim hizmet bedelinin <strong>defaten (tek seferde)</strong> ilgili emanet hesabına yatırılması esastır.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-extrabold text-foreground dark:text-white">
                  Toplam Alan &gt; 3.000 m²
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Yapı sahibinin tercihine göre <strong>defaten veya inşaat seviyesine göre 6 etapta</strong> yatırılabilir.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/80 dark:border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/50 dark:border-white/10 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    <th className="p-3">Etap</th>
                    <th className="p-3">İnşaat Aşaması</th>
                    <th className="p-3">Açıklama</th>
                    <th className="p-3">Hakediş Payı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-white/5">
                  {INSTALLMENT_STAGES.map((stg) => (
                    <tr key={stg.stage} className="hover:bg-muted/30 dark:hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-muted-foreground">
                        {stg.stage}. Etap
                      </td>
                      <td className="p-3 font-bold text-foreground dark:text-white">
                        {stg.name}
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground">
                        {stg.description}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                        {stg.percentText}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Mevzuat Notları */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-foreground dark:text-white">
              Mevzuat ve Kapsam Notları
            </h4>
            <div className="space-y-2.5">
              {YAPI_DENETIM_SOURCE_METADATA.notes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs leading-relaxed text-foreground dark:text-slate-300">
                    {note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 dark:border-white/5 dark:bg-white/5 space-y-2">
              <span className="font-bold text-xs text-foreground dark:text-white">
                Resmî Mevzuat Bağlantısı:
              </span>
              <p className="text-[11px] text-muted-foreground">
                4708 sayılı Yapı Denetimi Hakkında Kanun ve ilgili uygulama yönetmeliklerinin tam metnine
                resmî mevzuat portalından ulaşabilirsiniz:
              </p>
              <a
                href={YAPI_DENETIM_SOURCE_METADATA.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mevzuat Bilgi Sistemi — 4708 Sayılı Kanun
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function YapiDenetimTablesDialog({
  open,
  onOpenChange,
}: YapiDenetimTablesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-border/80 bg-card dark:border-white/10 dark:bg-[#090d20]"
        aria-describedby="yapi-denetim-dialog-desc"
      >
        <DialogTitle className="sr-only">
          2026 Yapı Denetimi Tabloları ve Kuralları
        </DialogTitle>
        <DialogDescription className="sr-only">
          4708 sayılı mevzuat oranları ve birim maliyet tabloları
        </DialogDescription>
        <YapiDenetimTablesContent />
      </DialogContent>
    </Dialog>
  );
}
