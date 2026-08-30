"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, TableProperties } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildRebarAreaMatrix,
  buildRebarUnitWeightTable,
  formatAreaMm2,
  formatDecimal,
  formatInteger,
  formatWeight,
  type RebarDiameter,
} from "@/lib/rebar-calculations";
import { cn } from "@/lib/utils";

interface RebarReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "weights" | "areas";
  currentDiameter?: number;
  currentQuantity?: number;
  onSelectCombination?: (diameter: RebarDiameter, quantity: number) => void;
}

export function RebarReferenceDialog({
  open,
  onOpenChange,
  defaultTab = "weights",
  currentDiameter,
  currentQuantity,
  onSelectCombination,
}: RebarReferenceDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Sync tab when defaultTab prop changes on open
  useEffect(() => {
    if (open && defaultTab) {
      const timer = setTimeout(() => setActiveTab(defaultTab), 0);
      return () => clearTimeout(timer);
    }
  }, [open, defaultTab]);

  const weightRows = useMemo(() => buildRebarUnitWeightTable(), []);
  const areaMatrix = useMemo(() => buildRebarAreaMatrix(10), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[82vh] max-h-[82vh] sm:h-[80vh] flex flex-col p-4 sm:p-6 bg-card dark:bg-[#0c0a1e] border border-border dark:border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.2)] focus:outline-none">
        <DialogHeader className="pb-3 border-b border-border/70 dark:border-white/10 shrink-0 pr-8">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-purple-400" />
            <DialogTitle className="text-lg sm:text-2xl font-black tracking-tight text-foreground dark:text-white">
              Donatı Referans Tabloları
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-300 mt-0.5">
            Standart inşaat demiri birim ağırlık, metraj ve kesit alanı (As) matris verileri.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 mt-3"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-muted/60 dark:bg-[#16132e]/90 p-1 border border-border/60 dark:border-white/10 rounded-xl shrink-0">
            <TabsTrigger
              value="weights"
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-2 text-xs font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] text-muted-foreground dark:text-zinc-300"
            >
              <Scale className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate">Birim Ağırlık</span>
            </TabsTrigger>
            <TabsTrigger
              value="areas"
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-2 text-xs font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] text-muted-foreground dark:text-zinc-300"
            >
              <TableProperties className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate">Alan Matrisi (As)</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Unit Weight Table */}
          <TabsContent
            value="weights"
            className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1 focus-visible:outline-none flex flex-col justify-between"
          >
            <div className="rounded-2xl border border-border/80 dark:border-white/10 overflow-hidden bg-card/60 dark:bg-[#120f26]/80">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 dark:bg-[#16132e] border-b border-border/80 dark:border-white/10 text-muted-foreground dark:text-zinc-300 font-black text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 dark:bg-[#16132e] backdrop-blur z-10">Çap (Ø)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Tek Çubuk As</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Metretül Ağırlığı</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">12m Boy Ağırlığı</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">1 Ton Metrajı</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">1 Ton (12m Boy)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-white/10">
                    {weightRows.map((row) => {
                      const isCurrent = currentDiameter === row.diameter;
                      return (
                        <tr
                          key={row.diameter}
                          className={cn(
                            "transition-colors hover:bg-muted/30 dark:hover:bg-white/[0.04] font-mono",
                            isCurrent && "bg-purple-500/10 dark:bg-purple-500/20 font-bold",
                          )}
                        >
                          <td className="py-2 px-3 font-sans font-black sticky left-0 bg-card/95 dark:bg-[#0f0d24] backdrop-blur z-10 border-r border-border/40 dark:border-white/10">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted dark:bg-[#1e193d] border border-border/80 dark:border-white/15 text-xs font-mono font-black text-foreground dark:text-white">
                                Ø{row.diameter}
                              </span>
                              {isCurrent && (
                                <Badge className="border-purple-500/40 bg-purple-500/25 text-[9px] px-1.5 py-0 font-sans text-purple-700 dark:text-purple-200">
                                  Seçili
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-foreground dark:text-white font-bold">
                            {formatDecimal(row.barAreaCm2)} cm²{" "}
                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-normal">
                              ({formatAreaMm2(row.barAreaMm2)} mm²)
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-foreground dark:text-white font-black">
                            {formatWeight(row.weightPerMeterKg)} kg/m
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-purple-600 dark:text-purple-300 font-bold">
                            ~{formatWeight(row.weightPerBar12mKg)} kg
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-muted-foreground dark:text-zinc-300">
                            ~{formatDecimal(row.metersPerTon)} m
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-muted-foreground dark:text-zinc-300">
                            ~{formatInteger(row.barsPerTon12m)} adet
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground dark:text-zinc-400 text-center">
              * Çelik birim hacim ağırlığı standart 7.850 kg/m³ kabul edilerek TS 500 donatı çaplarına göre hesaplanmıştır.
            </p>
          </TabsContent>

          {/* Tab 2: As Area Matrix Table */}
          <TabsContent
            value="areas"
            className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1 focus-visible:outline-none flex flex-col justify-between"
          >
            <div className="rounded-2xl border border-border/80 dark:border-white/10 overflow-hidden bg-card/60 dark:bg-[#120f26]/80">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-muted/60 dark:bg-[#16132e] border-b border-border/80 dark:border-white/10 text-muted-foreground dark:text-zinc-300 font-black text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 sticky left-0 bg-muted/95 dark:bg-[#16132e] backdrop-blur z-20 text-left">
                        Çap (Ø)
                      </th>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <th key={i} className="py-2.5 px-2 whitespace-nowrap min-w-[50px]">
                          {i + 1}Ø
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-white/10">
                    {areaMatrix.map((row) => {
                      const isCurrentDiameter = currentDiameter === row.diameter;
                      const canSelect = [8, 10, 12, 14, 16, 18, 20].includes(row.diameter);

                      return (
                        <tr
                          key={row.diameter}
                          className={cn(
                            "transition-colors hover:bg-muted/30 dark:hover:bg-white/[0.04] font-mono",
                            isCurrentDiameter && "bg-purple-500/5",
                          )}
                        >
                          {/* Sticky Left Column */}
                          <td className="py-1.5 px-3 text-left font-sans font-black sticky left-0 bg-card/95 dark:bg-[#0f0d24] backdrop-blur z-10 border-r border-border/40 dark:border-white/10">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted dark:bg-[#1e193d] border border-border/80 dark:border-white/15 text-xs font-mono font-black text-foreground dark:text-white">
                              Ø{row.diameter}
                            </span>
                          </td>

                          {/* Matrix Cells */}
                          {row.areas.map((cell) => {
                            const isExactSelected =
                              isCurrentDiameter && currentQuantity === cell.quantity;

                            return (
                              <td
                                key={cell.quantity}
                                onClick={() => {
                                  if (canSelect && onSelectCombination) {
                                    onSelectCombination(row.diameter as RebarDiameter, cell.quantity);
                                    onOpenChange(false);
                                  }
                                }}
                                className={cn(
                                  "py-1.5 px-1.5 tabular-nums transition-all",
                                  canSelect && onSelectCombination
                                    ? "cursor-pointer hover:bg-purple-500/20 hover:text-foreground dark:hover:text-white"
                                    : "",
                                  isExactSelected
                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black rounded-md shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                                    : "text-foreground dark:text-zinc-100 font-medium",
                                )}
                                title={`${cell.quantity}Ø${row.diameter} = ${formatDecimal(cell.areaCm2)} cm²`}
                              >
                                <span className={cn(isExactSelected ? "text-white" : "")}>
                                  {formatDecimal(cell.areaCm2)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground dark:text-zinc-400">
              <span>* Değerler santimetrekare (cm²) cinsindendir.</span>
              <span className="font-semibold text-purple-600 dark:text-purple-300">
                Hücreye tıklayarak hesaba aktarabilirsiniz.
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
