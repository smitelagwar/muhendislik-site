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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground">
      <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-lg font-bold">
        <ArrowLeftRight className="h-5 w-5 text-primary" />
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
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
        className="mb-3 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      >
        {conversions[category].map((item, index) => (
          <option key={item.name} value={index}>
            {item.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">{conversion.from}</label>
          <input
            type="number"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <ArrowLeftRight className="mt-5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">{conversion.to}</label>
          <div className="min-h-[38px] w-full rounded-lg border border-accent bg-accent/20 p-2 text-sm font-semibold text-accent-foreground">
            {result || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
