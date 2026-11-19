"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";
import type { IdeElement, IdeProject } from "@/lib/hsyncad/ide-import";
import {
  saveNativeIdeSource,
  exportIdeDxf,
  exportIdeSvg,
  ideExportBasename,
  serializeIdeProject,
} from "@/lib/hsyncad/ide-export";
import { convertIdeSourceToNative, nativeIdeDownloadTargets } from "@/lib/hsyncad/ide-native-download";
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

  const canExportIde11 = Boolean(sourceFile && project?.format === "ide11");
  const canExportIde10 = Boolean(sourceFile && project?.format === "ide10");
  // Sürüm dönüşümü (trial→native) görünürlüğü: yalnız IDE11 şemasında kanıtlandı.
  const nativeDownload = nativeIdeDownloadTargets(project, sourceFile);

  const save = async (format: "source" | "snapshot" | "ide11" | "ide10" | "native-ide11" | "native-ide10" | "dxf" | "svg" | "png") => {
    if (!project || busy) return;
    setBusy(true); onError("");
    try {
      const base = ideExportBasename(project.filename), options = { elements, includeFoundations: true, labels };
      const floor = project.floors.find(f => f.id === floorId);
      const floorName = (floor?.name ?? "kat").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
      let filename: string;
      if (format === "source") {
        if (!sourceFile) throw new Error("Özgün dosyayı yeniden seçerek değiştirilmemiş kopyasını kaydedebilirsiniz.");
        filename = sourceFile.name.toLowerCase().endsWith(`.${project.format}`)
          ? sourceFile.name : `${ideExportBasename(sourceFile.name)}.${project.format}`;
        download(sourceFile, filename);
      } else if (format === "snapshot") {
        filename = `${base}.hsyncad`; download(new Blob([serializeIdeProject(project)], { type: "application/json;charset=utf-8" }), filename);
      } else if (format === "ide11" || format === "ide10") {
        if (!sourceFile) throw new Error("Native kayıt için özgün kaynak dosyası gerekir.");
        const saved = saveNativeIdeSource(await sourceFile.arrayBuffer(), project, format);
        filename = `${base}.${saved.format}`;
        download(new Blob([saved.bytes.buffer as ArrayBuffer], { type: "application/octet-stream" }), filename);
      } else if (format === "native-ide11" || format === "native-ide10") {
        // "Dönüştür + indir": kaynak baytları senkron dönüştürülür, YENİ adla
        // indirilir; açık proje ve kaynak dosya değiştirilmez. Transcoder'ın
        // güvenli-red hataları mevcut catch üzerinden onError ile gösterilir.
        if (!sourceFile) throw new Error("Sürüm dönüşümü için özgün kaynak dosyası gerekir.");
        const target = format === "native-ide11" ? "ide11" : "ide10";
        const converted = convertIdeSourceToNative(await sourceFile.arrayBuffer(), target);
        filename = `${base}.${target}`;
        // Transcoder tam boyutlu özel arabellek döndürür; değilse güvenli kopya.
        const payload = converted.byteOffset === 0 && converted.byteLength === converted.buffer.byteLength
          ? converted.buffer as ArrayBuffer : converted.slice().buffer as ArrayBuffer;
        download(new Blob([payload], { type: "application/octet-stream" }), filename);
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
      <button type="button" role="menuitem" data-testid="ide-download-native-ide11" disabled={!nativeDownload.ide11 || busy} onClick={() => void save("native-ide11")}>Native .ide11 indir</button>
      <button type="button" role="menuitem" data-testid="ide-download-native-ide10" disabled={!nativeDownload.ide10 || busy} onClick={() => void save("native-ide10")}>Native .ide10 indir</button>
      <hr />
      <button type="button" role="menuitem" data-testid="ide-export-dxf" disabled={!project || busy} onClick={() => void save("dxf")}>Aktif katı dışa aktar · DXF</button>
      <button type="button" role="menuitem" data-testid="ide-export-svg" disabled={!project || busy} onClick={() => void save("svg")}>Aktif katı dışa aktar · SVG</button>
      <button type="button" role="menuitem" data-testid="ide-export-png" disabled={!project || !planVisible || busy} onClick={() => void save("png")}>Görünen planı kaydet · PNG</button>
      <p>.hsyncad çözümlenen görünümü saklar. Native kayıt yalnız özgün biçimde, tüm kaynak baytları korunarak yapılır. "Native .ide11/.ide10 indir" kaynak dosyayı sürüm dönüşümüyle yeni dosya olarak indirir; açık projeyi değiştirmez. Düzenlenmiş modelin native kaydedilmesi doğrulanmadı; değişiklikler için .hsyncad kullanın.</p>
    </div>}
  </div>;
}
