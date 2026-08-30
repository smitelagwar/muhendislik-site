"use client";

import React, { forwardRef } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileSpreadsheet,
  Info,
  Layers,
  MapPin,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { formatCurrencyTL2, formatSayi } from "@/lib/calculations/core";
import type { YapiDenetimCalculationResult } from "@/lib/calculations/modules/yapi-denetim-ucreti";

interface YapiDenetimResultReportProps {
  result: YapiDenetimCalculationResult;
  className?: string;
}

export const YapiDenetimResultReport = forwardRef<HTMLDivElement, YapiDenetimResultReportProps>(
  function YapiDenetimResultReport({ result, className = "" }, ref) {
    const {
      input,
      effectiveYear,
      inspectionGroup,
      unitCost,
      areaBandLabel,
      serviceRate,
      discountRate,
      vatRate,
      approximateCost,
      baseServiceFee,
      regionalDiscountAmount,
      netServiceFee,
      vatAmount,
      grossTotal,
      smallBuilding,
      flags,
      paymentModel,
    } = result;

    const hasDiscount = discountRate > 0;
    const formattedRate = `%${(serviceRate * 100).toFixed(2).replace(".", ",")}`;
    const formattedDiscount = `%${Math.round(discountRate * 100)}`;

    return (
      <div
        ref={ref}
        id="yapi-denetim-result-report"
        className={`rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm backdrop-blur-2xl dark:border-amber-500/20 dark:bg-[#0c0d12]/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${className}`}
      >
        {/* Rapor Üst Başlık & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-400">
                Hesaplama Özeti
              </span>
              <h3 className="text-base font-extrabold text-foreground dark:text-white">
                {effectiveYear} Tahmini Yapı Denetim Hizmet Bedeli
              </h3>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300">
            <span>{effectiveYear} Seviyesi</span>
          </div>
        </div>

        {/* Ana Sonuç Kartı (Hero Result) */}
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] via-transparent to-transparent p-6 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-transparent">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            KDV Hariç Tahmini Hizmet Bedeli
          </div>
          <div
            data-testid="net-service-fee-display"
            className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl dark:text-white font-mono"
          >
            {formatCurrencyTL2(netServiceFee)}
          </div>

          <div className="mt-5 grid gap-3 pt-5 border-t border-amber-500/15 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-background/60 p-3 dark:bg-black/30 border border-border/40 dark:border-white/5">
              <span className="text-xs text-muted-foreground dark:text-slate-400">
                KDV (%{Math.round(vatRate * 100)})
              </span>
              <span
                data-testid="vat-amount-display"
                className="text-sm font-mono font-bold text-foreground dark:text-slate-200"
              >
                {formatCurrencyTL2(vatAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 dark:bg-amber-500/15 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                KDV Dahil Toplam
              </span>
              <span
                data-testid="gross-total-display"
                className="text-base font-mono font-black text-amber-900 dark:text-amber-100"
              >
                {formatCurrencyTL2(grossTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Teknik Döküm Tablosu */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground dark:text-slate-400">
            Teknik Hesap Parametreleri
          </h4>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">Denetim Grubu</span>
              <span className="font-bold text-foreground dark:text-white">{inspectionGroup}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">2026 Denetim Birim Maliyeti</span>
              <span className="font-mono font-bold text-foreground dark:text-white">
                {formatSayi(unitCost)} TL/m²
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">Esas Yaklaşık Maliyet</span>
              <span className="font-mono font-bold text-foreground dark:text-white">
                {formatCurrencyTL2(approximateCost)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">Uygulanan Alan Bandı</span>
              <span className="font-bold text-foreground dark:text-white">{areaBandLabel}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">Uygulanan Hizmet Oranı</span>
              <span className="font-mono font-bold text-foreground dark:text-white">
                {formattedRate} ({input.durationYears} Yıl)
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 dark:border-white/5 dark:bg-[#12141c]">
              <span className="text-muted-foreground dark:text-slate-400">Bölgesel İndirim</span>
              <span
                className={`font-mono font-bold ${
                  hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-foreground dark:text-white"
                }`}
              >
                {formattedDiscount}
              </span>
            </div>

            {hasDiscount && (
              <div className="col-span-full flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 dark:bg-emerald-500/10 text-xs">
                <span className="text-emerald-800 dark:text-emerald-300">
                  İndirimsiz Hizmet Bedeli (H₀)
                </span>
                <div className="text-right font-mono">
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrencyTL2(baseServiceFee)}
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    -{formatCurrencyTL2(regionalDiscountAmount)} indirim
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ödeme Esasları ve Hakediş Dağılımı (Yönetmelik Madde 27) */}
        <div
          data-testid="payment-model-section"
          className="mt-6 rounded-2xl border border-border/80 bg-muted/20 p-5 dark:border-white/10 dark:bg-[#111422]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground dark:text-white">
                Ödeme Esasları & Hakediş Dağılımı (Madde 27)
              </span>
            </div>
            <span
              data-testid="payment-modality-badge"
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                paymentModel.isUpfrontMandatory
                  ? "border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {paymentModel.modalityBadge}
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
            {paymentModel.summary}
          </p>

          {/* Emanet Hesabı Özel Bilgi Notu */}
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
            <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="leading-relaxed">
              <strong>Emanet Hesabı Kuralı:</strong> Yapı denetim ücreti asla yapı denetim şirketine elden veya doğrudan şirket hesabına ödenmez.
              Yapı sahibince Çevre, Şehircilik ve İklim Değişikliği Bakanlığı / Defterdarlık / İlgili İdare adına açılan resmî{" "}
              <strong>Yapı Denetim Emanet Hesabı</strong>&apos;na yatırılır. İdare, inşaatın ilerleme seviyesini onayladıkça bedeli etap etap kuruluşa aktarır.
            </span>
          </div>

          {/* 6 Etaplık Hakediş/Taksit Tablosu */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-border/70 dark:border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/60 dark:border-white/10 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                  <th className="p-2.5">Etap</th>
                  <th className="p-2.5">İnşaat İlerleme Aşaması</th>
                  <th className="p-2.5 text-center">Pay</th>
                  <th className="p-2.5 text-right">KDV Hariç</th>
                  <th className="p-2.5 text-right">KDV Dahil Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-white/5 font-mono">
                {paymentModel.installments.map((inst) => (
                  <tr key={inst.stage} className="hover:bg-muted/30 dark:hover:bg-white/[0.02]">
                    <td className="p-2.5 font-bold text-muted-foreground">{inst.stage}. Etap</td>
                    <td className="p-2.5 font-sans">
                      <div className="font-bold text-foreground dark:text-white">{inst.name}</div>
                      <div className="text-[11px] text-muted-foreground">{inst.description}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-400">
                      {inst.percentText}
                    </td>
                    <td className="p-2.5 text-right text-foreground dark:text-slate-200">
                      {formatCurrencyTL2(inst.netAmount)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-foreground dark:text-white">
                      {formatCurrencyTL2(inst.grossAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/80 bg-muted/50 dark:border-white/10 dark:bg-white/5 font-mono font-bold text-xs">
                  <td colSpan={2} className="p-2.5 font-sans text-foreground dark:text-white">
                    Toplam Hizmet Bedeli ({paymentModel.isUpfrontMandatory ? "Defaten Yatırılacak" : "Taksitler Toplamı"})
                  </td>
                  <td className="p-2.5 text-center text-amber-700 dark:text-amber-400">%100</td>
                  <td className="p-2.5 text-right text-foreground dark:text-slate-200">
                    {formatCurrencyTL2(netServiceFee)}
                  </td>
                  <td className="p-2.5 text-right text-amber-700 dark:text-amber-400">
                    {formatCurrencyTL2(grossTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Koşullu Blok 1: 500 m² ve Altı Özel Hüküm */}
        {smallBuilding.applies && (
          <div
            data-testid="small-building-section"
            className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 md:p-5 dark:border-blue-500/25 dark:bg-blue-500/10"
          >
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    500 m² ve Altı Yapılarda Özel Hüküm (Yönetmelik Madde 26/4)
                  </span>
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300">
                    Azami %3,50
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300">
                  Yukarıdaki ana hesapta yasal cetvel oranı (%{ (serviceRate * 100).toFixed(2).replace(".", ",") }) uygulanmıştır.
                  500 m² altındaki yapılarda hizmet bedeli oranı sözleşmeyle %3,50&apos;ye kadar artırılabilir.
                </p>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 rounded-xl bg-background/80 p-3 dark:bg-black/30 border border-blue-500/20 text-xs">
                  <div>
                    <span className="text-muted-foreground dark:text-slate-400">
                      %3,50 Durumunda KDV Hariç Azami:
                    </span>
                    <p className="mt-0.5 font-mono font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrencyTL2(smallBuilding.maxNetServiceFee)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground dark:text-slate-400">
                      %3,50 Durumunda KDV Dahil Azami:
                    </span>
                    <p className="mt-0.5 font-mono font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrencyTL2(smallBuilding.maxGrossTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Koşullu Blok 2: Çok Yıllı Proje Uyarısı */}
        {flags.isMultiYear && (
          <div
            data-testid="multi-year-note"
            className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/25 dark:bg-amber-500/10 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-800 dark:text-amber-200">
                  2026 Fiyat Seviyesinde Tahmin ({input.durationYears} Yıllık Proje):
                </span>
                <p className="mt-1 text-muted-foreground dark:text-slate-300 leading-relaxed">
                  Yapı Denetimi Uygulama Yönetmeliği Madde 26/6 uyarınca sonraki takvim yıllarına devreden
                  iş kısmı, işin yapılacağı uygulama yılının güncel birim maliyeti üzerinden değerlendirilir.
                  Bu sonuç, projenin tamamı 2026 fiyat düzeyinde kalması varsayımıyla üretilmiştir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Koşullu Blok 3: 200 m² Kapsam İnceleme Uyarısı */}
        {flags.possibleScopeReview && (
          <div
            data-testid="scope-review-warning"
            className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 dark:border-purple-500/25 dark:bg-purple-500/10 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-purple-800 dark:text-purple-200">
                  Kapsamı Doğrulayın (≤200 m² Bağımsız Yapı):
                </span>
                <p className="mt-1 text-muted-foreground dark:text-slate-300 leading-relaxed">
                  200 m² ve altındaki bazı tek parsel/bağımsız küçük yapılar kat adedi ve kullanım türüne göre
                  4708 sayılı Kanun kapsamı dışında (fenni mesuliyet sistemi) kalabilir. Bu hesap, yapının
                  4708 yapı denetimi sistemine tabi olduğu varsayımıyla sunulmuştur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alt Bilgi Dipnotu */}
        <div className="mt-6 border-t border-border/60 pt-4 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground dark:text-slate-500">
          <span>4708 s. Kanun & Yapı Denetimi Uygulama Yönetmeliği Madde 26</span>
          <span>Tahmini Bilgilendirme Amaçlıdır</span>
        </div>
      </div>
    );
  }
);
