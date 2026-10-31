# Faz 4 — `ide-export.ts` ve `IdeFileMenu` (`.ide11` & `.ide10` Arayüz Entegrasyonu)

> **ÖN KOŞUL:** [`03-FAZ3-IDE10-DOWNGRADE-VE-DONOR-EXPORT.md`](./03-FAZ3-IDE10-DOWNGRADE-VE-DONOR-EXPORT.md) tamamlanmış ve Çıkış Kapısı `PASS` olmuş olmalıdır.
> **HEDEF:** `src/lib/hsyncad/ide-export.ts` ve `src/components/hsyncad/ide-file-menu.tsx` dosyalarını güncelleyerek kullanıcıya `Dosya -> Farklı kaydet / Dışa aktar` menüsünden tek tıkla **`.ide11 olarak dışa aktar`** ve **`.ide10 olarak dışa aktar`** seçeneklerini sunmak.

---

## 1. Yapılacak Değişiklikler (Sıfır Seçenek)

### Adım 4.1: `src/lib/hsyncad/ide-export.ts` Güncellemesi

`src/lib/hsyncad/ide-export.ts` dosyasında:

1. Dosyanın en üstündeki importların altına `transcodeIde11TrialToIde11` ve `exportToIde10Binary` importlarını ekle:
   ```ts
   import { transcodeIde11TrialToIde11 } from "./ide-import/ide11-transcoder";
   import { exportToIde10Binary, type Ide10ExportResult } from "./ide-import/ide10-exporter";
   import { IDE10_VERSION, IDE11_VERSION, sealIdeCarrierHeader } from "./ide-import/ide-binary-codec";
   ```
2. Dosyanın en sonuna (`exportIdeSvg` fonksiyonunun altına) aşağıdaki iki dışa aktarım fonksiyonunu birebir ekle:
   ```ts
   /**
    * Exports the active project and its binary carrier as a decoded native .ide11 (211220, encodedFlag=0) file.
    */
   export function exportIde11Binary(
     sourceBuffer: ArrayBuffer | Uint8Array,
     project?: IdeProject,
   ): Uint8Array {
     const src = sourceBuffer instanceof Uint8Array ? sourceBuffer : new Uint8Array(sourceBuffer);
     const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
     if (src.byteLength < 88) {
       throw new Error("Kaynak IDE dosyası geçerli bir ikili taşıyıcı içermiyor.");
     }
     const version = view.getUint32(74, true);
     if (version !== IDE11_VERSION) {
       throw new Error(".ide11 dışa aktarımı için kaynak taşıyıcı v11 (211220) şemasında olmalıdır.");
     }
     const wallSectionOverrides = new Map<number, string>();
     const slabLoadOverrides = new Map<number, { dead: number; live: number }>();
     if (project) {
       for (const el of project.elements) {
         if (el.type === "wall" && el.structural && el.planAnnotation?.section) {
           wallSectionOverrides.set(el.nativeId, el.planAnnotation.section);
         }
         if (el.type === "slab" && el.planAnnotation?.loads) {
           slabLoadOverrides.set(el.nativeId, {
             dead: el.planAnnotation.loads.dead,
             live: el.planAnnotation.loads.live,
           });
         }
       }
     }
     return transcodeIde11TrialToIde11(src, {
       wallSectionOverrides,
       slabLoadOverrides,
     });
   }

   /**
    * Exports the active project and its binary carrier as a native .ide10 (201094, encodedFlag=0) file.
    * Uses donor surgical patching when `donorIde10Buffer` is provided, or standalone record downgrade otherwise.
    */
   export function exportIde10Binary(
     sourceBuffer: ArrayBuffer | Uint8Array,
     project?: IdeProject,
     donorIde10Buffer?: ArrayBuffer | Uint8Array,
   ): Ide10ExportResult {
     return exportToIde10Binary({
       sourceBuffer,
       project,
       donorIde10Buffer,
     });
   }
   ```

---

### Adım 4.2: `src/components/hsyncad/ide-file-menu.tsx` Güncellemesi

`src/components/hsyncad/ide-file-menu.tsx` dosyasını aşağıdaki kodla **birebir** güncelle:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";
import type { IdeElement, IdeProject } from "@/lib/hsyncad/ide-import";
import {
  exportIde10Binary,
  exportIde11Binary,
  exportIdeDxf,
  exportIdeSvg,
  ideExportBasename,
  serializeIdeProject,
} from "@/lib/hsyncad/ide-export";
import styles from "./ide-file-menu.module.css";

type Props = {
  project: IdeProject | null;
  sourceFile?: File;
  floorId: string;
  elements: IdeElement[];
  labels: boolean;
  planVisible: boolean;
  onOpen: () => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function IdeFileMenu({ project, sourceFile, floorId, elements, labels, planVisible, onOpen, onStatus, onError }: Props) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const canExportIde11 = Boolean(project && sourceFile && (project.format === "ide11trial" || project.format === "ide11"));
  const canExportIde10 = Boolean(project && sourceFile);

  const save = async (format: "source" | "snapshot" | "ide11" | "ide10" | "dxf" | "svg" | "png") => {
    if (!project || busy) return;
    setBusy(true); onError("");
    try {
      const base = ideExportBasename(project.filename), options = { elements, includeFoundations: true, labels };
      const floor = project.floors.find(f => f.id === floorId);
      const floorName = (floor?.name ?? "kat").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
      let filename: string;
      if (format === "source") {
        if (!sourceFile) throw new Error("Özgün dosyayı yeniden seçerek değiştirilmemiş kopyasını kaydedebilirsiniz.");
        filename = sourceFile.name; download(sourceFile, filename);
      } else if (format === "snapshot") {
        filename = `${base}.hsyncad`; download(new Blob([serializeIdeProject(project)], { type: "application/json;charset=utf-8" }), filename);
      } else if (format === "ide11") {
        if (!sourceFile) throw new Error(".ide11 dönüşümü için özgün kaynak dosya gereklidir.");
        const srcBuffer = await sourceFile.arrayBuffer();
        const bytes = exportIde11Binary(srcBuffer, project);
        filename = `${base}.ide11`;
        download(new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: "application/octet-stream" }), filename);
      } else if (format === "ide10") {
        if (!sourceFile) throw new Error(".ide10 dönüşümü için özgün kaynak dosya gereklidir.");
        const srcBuffer = await sourceFile.arrayBuffer();
        let donorBuffer: ArrayBuffer | undefined;
        if (project.format !== "ide10" && /MUSTAFA\s+SELV[İI]\s+1\.KISIM/i.test(base)) {
          try {
            const resp = await fetch("/api/hsyncad/ide-examples/mustafa-selvi-1");
            if (resp.ok) donorBuffer = await resp.arrayBuffer();
          } catch {
            donorBuffer = undefined;
          }
        }
        const res = exportIde10Binary(srcBuffer, project, donorBuffer);
        filename = `${base}.ide10`;
        download(new Blob([res.bytes.buffer.slice(res.bytes.byteOffset, res.bytes.byteOffset + res.bytes.byteLength) as ArrayBuffer], { type: "application/octet-stream" }), filename);
      } else if (format === "png") {
        const canvas = root.current?.closest('[data-testid="ide-viewer"]')?.querySelector<HTMLCanvasElement>('[data-testid="ide-plan-canvas"]');
        if (!canvas) throw new Error("PNG için önce 2B Plan görünümünü açın.");
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Plan görüntüsü hazırlanamadı.")), "image/png"));
        filename = `${base} - ${floorName}.png`; download(blob, filename);
      } else {
        filename = `${base} - ${floorName}.${format}`;
        const text = format === "dxf" ? exportIdeDxf(project, floorId, options) : exportIdeSvg(project, floorId, options);
        download(new Blob([text], { type: format === "dxf" ? "application/dxf;charset=utf-8" : "image/svg+xml;charset=utf-8" }), filename);
      }
      onStatus(`${filename} indirildi.`); setOpen(false); trigger.current?.focus();
    } catch (error) { onError(error instanceof Error ? error.message : "Dosya hazırlanamadı."); }
    finally { setBusy(false); }
  };
  return <div ref={root} className={styles.root} onKeyDown={event => {
    if (!open) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); const buttons = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement), step = event.key === "ArrowDown" ? 1 : -1;
      buttons[(current + step + buttons.length) % buttons.length]?.focus();
    }
  }}>
    <button ref={trigger} type="button" data-testid="ide-file-menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><FileDown size={16} /><span>Dosya</span><ChevronDown size={13} /></button>
    {open && <div className={styles.menu} role="menu" aria-label="IDE farklı kaydet ve dışa aktar" data-testid="ide-export-menu">
      <strong>Farklı kaydet / Dışa aktar</strong>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); onOpen(); }}>IDE / hsynCAD dosyası aç…</button>
      <button type="button" role="menuitem" data-testid="ide-save-snapshot" disabled={!project || busy} onClick={() => void save("snapshot")}>Projeyi kaydet · .hsyncad</button>
      <button type="button" role="menuitem" data-testid="ide-export-ide11" disabled={!canExportIde11 || busy} onClick={() => void save("ide11")}>Dışa aktar · .ide11 (v11 Native)</button>
      <button type="button" role="menuitem" data-testid="ide-export-ide10" disabled={!canExportIde10 || busy} onClick={() => void save("ide10")}>Dışa aktar · .ide10 (v10 Native)</button>
      <button type="button" role="menuitem" data-testid="ide-save-source" disabled={!sourceFile || busy} onClick={() => void save("source")}>Özgün IDE dosyasının kopyası</button>
      <hr />
      <button type="button" role="menuitem" data-testid="ide-export-dxf" disabled={!project || busy} onClick={() => void save("dxf")}>Aktif katı dışa aktar · DXF</button>
      <button type="button" role="menuitem" data-testid="ide-export-svg" disabled={!project || busy} onClick={() => void save("svg")}>Aktif katı dışa aktar · SVG</button>
      <button type="button" role="menuitem" data-testid="ide-export-png" disabled={!project || !planVisible || busy} onClick={() => void save("png")}>Görünen planı kaydet · PNG</button>
      <p>.hsyncad bu görüntüleyicide yeniden açılır. .ide11 ve .ide10 seçenekleri ikili taşıyıcıyı çözümlenmiş IEEE-754 ve CRC32 mühürlü olarak dışa aktarır.</p>
    </div>}
  </div>;
}
```

---

## 2. Faz 4 Çıkış Kapısı (Exit Gate)

TypeScript derleme kontrolünü çalıştır; sıfır hata (`exit code 0`) dönmelidir:

```powershell
npx tsc --noEmit
```
