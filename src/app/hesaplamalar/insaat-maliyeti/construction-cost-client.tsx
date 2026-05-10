"use client";

import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { Wizard } from "./_components/wizard-layout";
import { ResultDashboard } from "./_components/result-dashboard";
import {
  ProjectInputsV3,
  ConstructionCostResultV3,
  calculateConstructionCostV3,
} from "@/lib/calculations/modules/insaat-maliyeti-v3";

export function ConstructionCostClient() {
  const [result, setResult] = useState<ConstructionCostResultV3 | null>(null);

  const handleComplete = (inputs: ProjectInputsV3) => {
    const calcResult = calculateConstructionCostV3(inputs);
    setResult(calcResult);
    // Küçük gecikmeyle scroll: animasyon render olduktan sonra
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleReset = () => {
    setResult(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-12 dark:bg-[#0a0a0a] md:pt-16">
      <div className="container mx-auto px-4">
        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/25 dark:bg-amber-500/20 dark:shadow-amber-500/10">
            <Calculator className="h-8 w-8 text-white dark:text-amber-400" />
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl lg:text-5xl">
            İnşaat Maliyeti Analizi
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-500 dark:text-slate-400">
            2025 Türkiye piyasa fiyatlarına göre — beton, demir, tuğla ve tüm kalemleri kapsayan gerçekçi ön maliyet tahmini.
          </p>
        </div>

        {/* Content */}
        <div className="mx-auto">
          {!result ? (
            <Wizard onComplete={handleComplete} />
          ) : (
            <ResultDashboard result={result} onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  );
}
