"use client";
import { useCallback, useState } from "react";
import type { CadModel, Point } from "@/lib/hsyncad/model";
import { DRAFTING_NAMES, draftingSummary, isDraftingTool, type DraftingItem, type ReferenceFrame } from "@/lib/hsyncad/drafting";
import { distance } from "@/lib/hsyncad/geometry";
import type { Tool } from "./editor-state";

export function useReferenceTools(model: CadModel, floorId: string, tool: Tool, commit: (m: CadModel, message: string) => boolean, message: (s: string) => void) {
  const [pending, setPending] = useState<Point[]>([]), [selectedId, setSelectedId] = useState("");
  const clear = useCallback(() => setPending([]), []);
  const items = model.drafting?.items.filter(i => i.floorId === floorId) ?? [];
  const frame = model.drafting?.frames?.[floorId];
  function setFrame(next: ReferenceFrame) {
    return commit({ ...model, drafting: { items: model.drafting?.items ?? [], frames: { ...model.drafting?.frames, [floorId]: next } } }, next.enabled ? "Lokal koordinat sistemi etkin. Koordinat kutusunda Lokal X/Y kullanılabilir." : "Global koordinat sistemine dönüldü.");
  }
  function add(points: Point[]) {
    if (!isDraftingTool(tool)) return;
    let number = 1;
    while (items.some(i => i.name === `${DRAFTING_NAMES[tool]} ${number}`)) number++;
    const item: DraftingItem = { id: crypto.randomUUID(), floorId, kind: tool, name: `${DRAFTING_NAMES[tool]} ${number}`, points };
    const drafting = { ...model.drafting, items: [...(model.drafting?.items ?? []), item] };
    if (tool === "referencePoint") drafting.frames = { ...drafting.frames, [floorId]: { origin: points[0], angle: 0, enabled: true } };
    if (commit({ ...model, drafting }, `${item.name}: ${draftingSummary(item)}. Kayıt koordinatlara bağlıdır; yapı elemanlarını değiştirmez.`)) { clear(); setSelectedId(item.id); }
  }
  function place(point: Point) {
    if (!isDraftingTool(tool)) return;
    if (tool === "referencePoint") { add([point]); return; }
    if (tool === "measureArea" && pending.length >= 3 && distance(point, pending[0]) < 0.08) { add(pending); return; }
    if (pending.some(p => distance(p, point) < 1e-6) && tool !== "measureAngle") { message("Farklı bir nokta seçin."); return; }
    const next = [...pending, point], count = tool === "measureAngle" ? 3 : tool === "measureArea" ? Infinity : 2;
    if (next.length >= count) add(next); else setPending(next);
  }
  function remove(id: string) {
    if (commit({ ...model, drafting: { ...model.drafting, items: (model.drafting?.items ?? []).filter(i => i.id !== id) } }, "Ölçüm / referans kaldırıldı. Geri al ile döndürülebilir.")) { setSelectedId(""); clear(); }
  }
  function finish() { if (tool === "measureArea" && pending.length >= 3) add(pending); }
  const instruction = tool === "measureAngle" ? ["İlk kol üzerindeki noktayı seçin", "Açının tepe noktasını seçin", "İkinci kol üzerindeki noktayı seçin"][Math.min(2, pending.length)] : tool === "measureArea" ? `${pending.length} köşe · İlk noktaya tıklayın veya Enter ile tamamlayın` : tool === "referencePoint" ? "Lokal orijin noktasını seçin" : pending.length ? "İkinci noktayı seçin" : "İlk noktayı seçin";
  return { pending, clear, place, finish, items, frame, setFrame, remove, selectedId, setSelectedId, instruction };
}
