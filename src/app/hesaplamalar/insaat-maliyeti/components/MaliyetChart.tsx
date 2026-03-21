"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CalculationResultSnapshot } from "@/lib/calculations/types";

// Recharts Tooltip Customization
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border border-zinc-800 bg-[#111] px-3 py-2 shadow-xl">
        <p className="mb-1 text-xs font-semibold text-zinc-300">{data.name}</p>
        <p className="text-sm font-bold tabular-nums" style={{ color: data.payload.color }}>
          {data.value.toLocaleString("tr-TR")} TL
        </p>
        <p className="text-[10px] text-zinc-500">%{data.payload.pct}</p>
      </div>
    );
  }
  return null;
};

export function MaliyetChart({ snapshot }: { snapshot: CalculationResultSnapshot }) {
  const data = [
    {
      name: "Kaba İşler",
      value: snapshot.kabaIsToplamı,
      color: "#3b82f6", // blue-500
      pct: (snapshot.kabaIsPct * 100).toFixed(1),
    },
    {
      name: "İnce İşler",
      value: snapshot.inceIsToplamı,
      color: "#10b981", // emerald-500
      pct: (snapshot.inceIsPct * 100).toFixed(1),
    },
    {
      name: "Diğer Giderler",
      value: snapshot.digerToplamı,
      color: "#a855f7", // purple-500
      pct: (snapshot.digerPct * 100).toFixed(1),
    },
  ].filter(d => d.value > 0);

  return (
    <div className="flex h-56 w-full items-center justify-center">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <span className="text-xs text-zinc-600">Veri hesaplanıyor...</span>
      )}
    </div>
  );
}
