"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";

type ConversionCategory = "force" | "length" | "stress" | "area";

interface Conversion {
  name: string;
  from: string;
  to: string;
  factor: number;
}

const conversions: Record<ConversionCategory, Conversion[]> = {
  force: [
    { name: "kN -> tf", from: "kN", to: "tf", factor: 0.10197 },
    { name: "tf -> kN", from: "tf", to: "kN", factor: 9.80665 },
    { name: "kN -> kgf", from: "kN", to: "kgf", factor: 101.972 },
    { name: "kgf -> N", from: "kgf", to: "N", factor: 9.80665 },
  ],
  length: [
    { name: "m -> cm", from: "m", to: "cm", factor: 100 },
    { name: "cm -> mm", from: "cm", to: "mm", factor: 10 },
    { name: "m -> mm", from: "m", to: "mm", factor: 1000 },
    { name: "inch -> cm", from: "inch", to: "cm", factor: 2.54 },
  ],
  stress: [
    { name: "MPa -> kgf/cm²", from: "MPa", to: "kgf/cm²", factor: 10.1972 },
    { name: "kgf/cm² -> MPa", from: "kgf/cm²", to: "MPa", factor: 0.0980665 },
    { name: "MPa -> psi", from: "MPa", to: "psi", factor: 145.038 },
    { name: "atm -> kPa", from: "atm", to: "kPa", factor: 101.325 },
  ],
  area: [
    { name: "m² -> cm²", from: "m²", to: "cm²", factor: 10000 },
    { name: "cm² -> mm²", from: "cm²", to: "mm²", factor: 100 },
    { name: "m² -> ft²", from: "m²", to: "ft²", factor: 10.7639 },
  ],
};

const categoryLabels: Record<ConversionCategory, string> = {
  force: "Kuvvet",
  length: "Uzunluk",
  stress: "Gerilme",
  area: "Alan",
};

export function UnitConverter() {
  const [category, setCategory] = useState<ConversionCategory>("force");
  const [selectedConversion, setSelectedConversion] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const conversion = conversions[category][selectedConversion];
  const result = useMemo(() => {
    if (!inputValue) {
      return "";
    }

    const parsed = Number(inputValue.replace(",", "."));
    return Number.isFinite(parsed) ? (parsed * conversion.factor).toFixed(4) : "";
  }, [conversion.factor, inputValue]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3 text-lg font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
        <ArrowLeftRight className="h-5 w-5 text-blue-700 dark:text-blue-500" />
        Birim Dönüştürücü
      </h3>

      <div className="mb-4 flex flex-wrap gap-1">
        {(Object.keys(conversions) as ConversionCategory[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setSelectedConversion(0);
              setInputValue("");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              category === item
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {categoryLabels[item]}
          </button>
        ))}
      </div>

      <select
        value={selectedConversion}
        onChange={(event) => {
          setSelectedConversion(Number(event.target.value));
          setInputValue("");
        }}
        className="mb-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {conversions[category].map((item, index) => (
          <option key={item.name} value={index}>
            {item.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">{conversion.from}</label>
          <input
            type="number"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <ArrowLeftRight className="mt-5 h-4 w-4 flex-shrink-0 text-zinc-400" />
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">{conversion.to}</label>
          <div className="min-h-[38px] w-full rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
            {result || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
