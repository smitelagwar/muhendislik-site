"use client";
import { useState } from "react";
import type { EditOperation } from "@/lib/hsyncad/edit-commands";
export default function EditDialog({ operation, onApply }: { operation: EditOperation; onApply: (dx: number, dy: number, angle: number, count: number) => void }) {
  const [dx, setDx] = useState(1), [dy, setDy] = useState(0), [angle, setAngle] = useState(90), [count, setCount] = useState(2);
  const angular = operation === "rotate" || operation === "mirror";
  return <form onSubmit={e => { e.preventDefault(); onApply(dx, dy, angle, count); }}>
    <p className="hcad-fine">Tek seçili eleman. Referans kolon konumu, döşemenin ilk köşesi veya çizginin başlangıcıdır. Yeni kopyanın dış düğüm ve çevre bağları ayrılır; mevcut elemanın düzenlenmesi bağlı modeli atomik günceller.</p>
    <div className="hcad-fields">{angular ? <label className="hcad-field"><span>{operation === "mirror" ? "Ayna doğrusu açısı (°)" : "Dönme açısı (°)"}</span><input type="number" step="any" required value={angle} onChange={e => setAngle(e.target.valueAsNumber)} /></label> : <>{[["X ötelenmesi (m)", dx, setDx], ["Y ötelenmesi (m)", dy, setDy]].map(([label, value, setter]) => <label className="hcad-field" key={String(label)}><span>{String(label)}</span><input type="number" step="any" required value={value as number} onChange={e => (setter as (n: number) => void)(e.target.valueAsNumber)} /></label>)}</>}
    {operation === "array" && <label className="hcad-field"><span>Kopya sayısı</span><input type="number" min={1} max={50} required value={count} onChange={e => setCount(e.target.valueAsNumber)} /></label>}</div>
    <button type="submit">İşlemi uygula</button>
  </form>;
}
