"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CadModel } from "@/lib/hsyncad/model";
import type { IdeProject } from "@/lib/hsyncad/ide-import";
import type { AnalysisResult } from "@/lib/hsyncad/analysis";
import {
  DEFAULT_IDE_REPORT_SECTIONS,
  IDE_REPORT_TREE_GROUPS,
  INITIAL_RPT_FLAGS,
  buildRptProfileBytes,
  createIdeSourcePdf,
  deriveSectionsFromRptFlags,
  getIdeReportGroupPresence,
  parseRptProfileBytes,
  syncRptFlagsWithGroup,
  syncRptFlagsWithLeaf,
  type IdeMetrajOptions,
} from "@/lib/hsyncad/ide-source-report";
import "./local-report-dialog.css";

export type IdeSourceSession = { file: File; modelSnapshot: string; project: IdeProject };

type ReportOptionsPayload = {
  scope?: "all" | "active_floor";
  analysis?: "fresh" | "saved";
  staircaseSmart?: boolean;
  activeFloorName?: string;
  sections?: string[];
  ideKapak?: boolean;
  rptFlags?: boolean[];
};

type Receipt = {
  jobId: string;
  status: string;
  sourceSha256: string;
  modelRevision: string;
  profileSha256?: string;
  optionsSha256?: string;
  reportOptions?: ReportOptionsPayload;
  warnings: string[] | null;
  warningsStatus: string;
  error?: string;
  pdf: string;
};

type MetrajState = {
  kalip: boolean;
  beton: boolean;
  donati: boolean;
  detay: boolean;
};

const sha = async (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), x => x.toString(16).padStart(2, "0")).join("");

const asciiJson = (value: unknown) =>
  JSON.stringify(value).replace(/[\u007f-\uffff]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

const sameStringSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every(item => b.includes(item));

const sameBooleanList = (a: readonly boolean[], b: readonly boolean[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

function todayTrDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function isoDateToTr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function sanitizeFilenameBase(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "hsyncad-rapor";
}

const titles: Record<string, string> = {
  prepared: "İş hazırlanıyor",
  opening: "Dosya açılıyor",
  checking_results: "Sonuçlar kontrol ediliyor",
  analyzing: "ideCAD analiz yapıyor",
  reporting: "Rapor hazırlanıyor",
  verifying: "Önizleme doğrulanıyor",
  ready: "ideCAD önizlemesi açık",
  cancelled: "İş iptal edildi",
  failed: "İş tamamlanamadı",
  preview_closed_or_stale: "Önizleme kapandı veya değişti",
  preview_unknown: "Önizleme durumu doğrulanamadı",
  source_changed: "İş kaynağı değişti",
  closed: "Önizleme kapatıldı",
};

const CELIK_GROUP = IDE_REPORT_TREE_GROUPS.find(g => g.id === "celik");

function createInitialCelikFlags(): Record<string, boolean> {
  return Object.fromEntries((CELIK_GROUP?.children ?? []).map(c => [c.id, c.defaultChecked]));
}

function createInitialExpandedGroups(): Record<string, boolean> {
  const expanded: Record<string, boolean> = { metraj: true };
  IDE_REPORT_TREE_GROUPS.forEach((g, idx) => {
    if (g.children.length > 0 && idx < 6) {
      expanded[g.id] = true;
    }
  });
  return expanded;
}

const METRAJ_LEAVES: readonly { key: keyof MetrajState; label: string }[] = [
  { key: "kalip", label: "Kalıp Metrajı (m²)" },
  { key: "beton", label: "Beton Metrajı (m³)" },
  { key: "donati", label: "Donatı / Özet Metraj" },
  { key: "detay", label: "Kata ve Elemana Göre Detaylı Metraj" },
];

function TriStateCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate) && !checked;
    }
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={e => onChange(e.target.checked)}
    />
  );
}

export default function LocalReportDialog({
  open,
  onClose,
  source,
  onReselect,
  model,
  activeFloorId,
  activeFloorName,
  selectedElementIds = [],
  analysisResult = null,
}: {
  open: boolean;
  onClose: () => void;
  source: IdeSourceSession | null;
  onReselect: (source: IdeSourceSession) => void;
  model: CadModel;
  activeFloorId?: string;
  activeFloorName?: string;
  selectedElementIds?: string[];
  analysisResult?: AnalysisResult | null;
}) {
  // 146-flag .rpt tree state + 16 local steel flags + 4 metraj flags
  const [rptFlags, setRptFlags] = useState<boolean[]>(() => [...INITIAL_RPT_FLAGS]);
  const [celikLeafFlags, setCelikLeafFlags] = useState<Record<string, boolean>>(createInitialCelikFlags);
  const [metrajState, setMetrajState] = useState<MetrajState>({
    kalip: true,
    beton: true,
    donati: true,
    detay: true,
  });

  // Tree expansion state
  const [rootExpanded, setRootExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(createInitialExpandedGroups);

  // Header & Logo metadata
  const [designer, setDesigner] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [dateNote, setDateNote] = useState(todayTrDate);
  const [writeProjectFilename, setWriteProjectFilename] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState("");

  // Scope
  const [scope, setScope] = useState<"all" | "active_floor" | "selected">("all");
  const [selectedFloorName, setSelectedFloorName] = useState<string>("");

  // Building & soil info
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("KONUT");
  const [pafta, setPafta] = useState("");
  const [ada, setAda] = useState("");
  const [parsel, setParsel] = useState("");
  const [soilGroup, setSoilGroup] = useState<"" | "A" | "B" | "C" | "D">("");

  // Local ideCAD desktop job state
  const [analysis, setAnalysis] = useState<"fresh" | "saved">("fresh");
  const [stairs, setStairs] = useState<"ask" | "yes" | "no">("ask");
  const [jobId, setJobId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const rptLoadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [open]);

  const activeSourceProject = source?.project ?? model.ideImport?.source ?? null;

  const availableFloors = useMemo(
    () => (activeSourceProject?.floors.length ? activeSourceProject.floors : model.floors),
    [activeSourceProject, model.floors]
  );

  const defaultFloorName = useMemo(() => {
    if (!availableFloors.length) return "";
    const byId = activeFloorId ? availableFloors.find(f => f.id === activeFloorId) : undefined;
    if (byId) return byId.name;
    const byName = activeFloorName ? availableFloors.find(f => f.name === activeFloorName) : undefined;
    return byName?.name ?? availableFloors[0].name;
  }, [availableFloors, activeFloorId, activeFloorName]);

  const resolvedFloorName = availableFloors.some(f => f.name === selectedFloorName)
    ? selectedFloorName
    : defaultFloorName;

  const resolvedDesktopScope: "all" | "active_floor" =
    scope === "active_floor" && resolvedFloorName ? "active_floor" : "all";

  const derivedSections = useMemo(() => deriveSectionsFromRptFlags(rptFlags), [rptFlags]);
  const effectiveIdeKapak = derivedSections.includes("aciklama") && Boolean(rptFlags[1]);

  const modelText = useMemo(() => JSON.stringify(model), [model]);
  const currentText = useRef(modelText);
  useLayoutEffect(() => {
    currentText.current = modelText;
  }, [modelText]);

  const sameModelSnapshot = !!source && source.modelSnapshot === modelText;
  const isIde10Source = !!source && /\.ide10$/i.test(source.file.name);
  const sameRevision = sameModelSnapshot && isIde10Source;
  const active =
    sending ||
    (!!receipt &&
      !["ready", "failed", "cancelled", "preview_closed_or_stale", "preview_unknown", "source_changed", "closed"].includes(
        receipt.status
      ));

  const presence = useMemo(
    () =>
      getIdeReportGroupPresence(
        source?.project ?? model.ideImport?.source ?? null,
        model,
        scope,
        scope === "active_floor" ? resolvedFloorName : undefined,
        selectedElementIds
      ),
    [source, model, scope, resolvedFloorName, selectedElementIds]
  );

  const presenceSummary = useMemo(() => {
    const selectedSet = new Set(derivedSections);
    let presentGroups = 0;
    let omittedSelected = 0;
    for (const g of IDE_REPORT_TREE_GROUPS) {
      const gp = presence[g.id];
      if (!gp?.applicable) continue;
      if (gp.present) presentGroups += 1;
      else if (selectedSet.has(g.id)) omittedSelected += 1;
    }
    return { presentGroups, omittedSelected };
  }, [presence, derivedSections]);

  // Tri-state status for Metraj branch
  const metrajCheckedCount = METRAJ_LEAVES.filter(m => metrajState[m.key]).length;
  const metrajAllChecked = metrajCheckedCount === METRAJ_LEAVES.length;
  const metrajIndeterminate = metrajCheckedCount > 0 && !metrajAllChecked;

  // Tri-state status for root "Raporlar" node
  const rootStats = useMemo(() => {
    let total = 0;
    let checked = 0;
    for (const g of IDE_REPORT_TREE_GROUPS) {
      if (g.rptSupported) {
        if (g.children.length > 0) {
          for (const leaf of g.children) {
            total += 1;
            if (leaf.treeIdx !== null && rptFlags[leaf.treeIdx]) checked += 1;
          }
        } else {
          total += 1;
          if (g.parentTreeIdx !== null && rptFlags[g.parentTreeIdx]) checked += 1;
        }
      } else {
        for (const leaf of g.children) {
          total += 1;
          if (celikLeafFlags[leaf.id]) checked += 1;
        }
      }
    }
    for (const m of METRAJ_LEAVES) {
      total += 1;
      if (metrajState[m.key]) checked += 1;
    }
    return {
      allChecked: total > 0 && checked === total,
      indeterminate: checked > 0 && checked < total,
      anyChecked: checked > 0,
    };
  }, [rptFlags, celikLeafFlags, metrajState]);

  const anyBranchCollapsed = useMemo(() => {
    const groupsWithChildren = IDE_REPORT_TREE_GROUPS.filter(g => g.children.length > 0).map(g => g.id);
    return [...groupsWithChildren, "metraj"].some(id => !expandedGroups[id]);
  }, [expandedGroups]);

  const optionsMatchPreview = useMemo(() => {
    if (!receipt || receipt.status !== "ready" || !receipt.reportOptions) return true;
    const ro = receipt.reportOptions;
    const roScope = ro.scope ?? "all";
    if (roScope !== resolvedDesktopScope) return false;
    if (roScope === "active_floor" && ro.activeFloorName !== resolvedFloorName) return false;
    const roSections = ro.sections ?? DEFAULT_IDE_REPORT_SECTIONS;
    if (!sameStringSet(roSections, derivedSections)) return false;
    const roKapak = roSections.includes("aciklama") ? (ro.ideKapak ?? true) : false;
    if (roKapak !== effectiveIdeKapak) return false;
    if (ro.rptFlags && !sameBooleanList(ro.rptFlags, rptFlags)) return false;
    return true;
  }, [receipt, resolvedDesktopScope, resolvedFloorName, derivedSections, effectiveIdeKapak, rptFlags]);

  useEffect(() => {
    if (!jobId || !open) return;
    const id = jobId;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      try {
        const response = await fetch(`/api/hsyncad/local-report?jobId=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Yerel rapor durumu alınamadı.");
        const data: Receipt = await response.json();
        if (stopped) return;
        setReceipt(data);
        if (!["failed", "cancelled", "preview_closed_or_stale", "source_changed", "closed"].includes(data.status)) {
          timer = setTimeout(check, data.status === "ready" ? 10000 : 2000);
        }
      } catch {
        if (!stopped) {
          setMessage("Yerel rapor hizmetine erişilemedi.");
          timer = setTimeout(check, 5000);
        }
      }
    }
    void check();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, open]);

  function applyDefaultProfile() {
    setRptFlags([...INITIAL_RPT_FLAGS]);
    setCelikLeafFlags(createInitialCelikFlags());
    setMetrajState({ kalip: true, beton: true, donati: true, detay: true });
    setMessage("Varsayılan ideCAD profili yüklendi.");
  }

  function selectAllTree(checked: boolean) {
    let next = [...rptFlags];
    for (const g of IDE_REPORT_TREE_GROUPS) {
      if (g.rptSupported) {
        next = syncRptFlagsWithGroup(next, g.id, checked);
      }
    }
    setRptFlags(next);
    setCelikLeafFlags(Object.fromEntries((CELIK_GROUP?.children ?? []).map(c => [c.id, checked])));
    setMetrajState({ kalip: checked, beton: checked, donati: checked, detay: checked });
  }

  function toggleAllBranches() {
    const shouldExpand = !rootExpanded || anyBranchCollapsed;
    setRootExpanded(true);
    const next: Record<string, boolean> = { metraj: shouldExpand };
    for (const g of IDE_REPORT_TREE_GROUPS) {
      if (g.children.length > 0) next[g.id] = shouldExpand;
    }
    setExpandedGroups(next);
  }

  function toggleGroupExpand(groupId: string) {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function handleGroupCheck(groupId: string, rptSupported: boolean, checked: boolean) {
    if (rptSupported) {
      setRptFlags(prev => syncRptFlagsWithGroup(prev, groupId, checked));
    } else if (groupId === "celik") {
      setCelikLeafFlags(Object.fromEntries((CELIK_GROUP?.children ?? []).map(c => [c.id, checked])));
    }
  }

  function handleLeafCheck(groupId: string, rptSupported: boolean, leafId: string, treeIdx: number | null, checked: boolean) {
    if (rptSupported && treeIdx !== null) {
      setRptFlags(prev => syncRptFlagsWithLeaf(prev, groupId, treeIdx, checked));
    } else if (groupId === "celik") {
      setCelikLeafFlags(prev => ({ ...prev, [leafId]: checked }));
    }
  }

  function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Lütfen geçerli bir görsel dosyası (PNG, JPG, WEBP) seçin.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        setLogoDataUrl(reader.result);
        setMessage(`Firma logosu yüklendi: ${file.name}`);
      } else {
        setMessage("Logo görseli okunamadı.");
      }
    };
    reader.onerror = () => setMessage("Logo görseli okunurken hata oluştu.");
    reader.readAsDataURL(file);
  }

  function saveRptProfile() {
    try {
      const bytes = buildRptProfileBytes(rptFlags);
      const base = sanitizeFilenameBase(source?.project.name || source?.file.name || model.name || "statik-rapor");
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/octet-stream" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.rpt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Rapor profili (.rpt) kaydedildi (193 bayt): ${base}.rpt`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Rapor profili (.rpt) kaydedilemedi.");
    }
  }

  async function loadRptProfile(file: File | undefined) {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseRptProfileBytes(buf);
      setRptFlags(parsed);
      setMessage("Rapor profili (.rpt) yüklendi (193 bayt, 146 seçenek).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Geçersiz .rpt profil dosyası.");
    }
  }

  async function generateCombinedPdf() {
    if (!derivedSections.length && !metrajCheckedCount) {
      setMessage("Rapor oluşturmak için en az bir rapor bölümü veya metraj seçeneği seçilmelidir.");
      return;
    }
    if (scope === "selected" && selectedElementIds.length === 0) {
      setMessage("Seçili elemanlar kapsamı için çalışma alanında en az bir eleman seçin.");
      return;
    }
    setGeneratingPdf(true);
    setMessage("");
    try {
      let sourceHash: string;
      let revision: string;
      const activeSource = sameModelSnapshot && source ? source.project : model.ideImport?.source ?? null;

      if (sameModelSnapshot && source) {
        sourceHash = await sha(await source.file.arrayBuffer());
        revision = await sha(new TextEncoder().encode(source.modelSnapshot).buffer as ArrayBuffer);
        if (currentText.current !== source.modelSnapshot) {
          throw new Error("Model değişti; PDF raporu yeniden hazırlanamadı.");
        }
      } else {
        const modelHash = await sha(new TextEncoder().encode(modelText).buffer as ArrayBuffer);
        sourceHash = modelHash;
        revision = modelHash;
      }

      const metrajOptions: IdeMetrajOptions = {
        enabled: metrajCheckedCount > 0,
        kalip: metrajState.kalip,
        beton: metrajState.beton,
        donati: metrajState.donati,
        detay: metrajState.detay,
      };

      const latestReceiptWarnings = receipt?.status === "ready" && optionsMatchPreview ? receipt.warnings : undefined;
      const latestWarningsStatus = receipt?.status === "ready" && optionsMatchPreview ? receipt.warningsStatus : undefined;
      const latestProfileSha = receipt?.status === "ready" && optionsMatchPreview ? receipt.profileSha256 : undefined;
      const latestOptionsSha = receipt?.status === "ready" && optionsMatchPreview ? receipt.optionsSha256 : undefined;

      const structuralSettings = (
        model as CadModel & {
          structural?: {
            settings?: Record<string, { value?: string | number | null }>;
          };
        }
      ).structural?.settings;

      const sourceConcreteMat = activeSource?.materials?.find(m => m.kind === "concrete");
      const resolvedConcreteGrade =
        analysisResult?.settings.concreteGrade ??
        (typeof structuralSettings?.concreteGrade?.value === "string" ? structuralSettings.concreteGrade.value : undefined) ??
        sourceConcreteMat?.name ??
        model.materials[0]?.name;
      const resolvedRebarGrade =
        analysisResult?.settings.rebarGrade ??
        (typeof structuralSettings?.rebarGrade?.value === "string" ? structuralSettings.rebarGrade.value : undefined) ??
        (sourceConcreteMat?.fykMpa ? `B${Math.round(sourceConcreteMat.fykMpa)}C` : undefined);
      const resolvedSoilClass =
        soilGroup ||
        (typeof structuralSettings?.soilClass?.value === "string" ? structuralSettings.soilClass.value : undefined);
      const resolvedDts = structuralSettings?.dts?.value ?? undefined;
      const resolvedBys = structuralSettings?.bys?.value ?? undefined;

      const bytes = createIdeSourcePdf(activeSource, sourceHash, revision, {
        project: true,
        slabLoads: true,
        elements: true,
        scope,
        activeFloorName: scope === "active_floor" ? resolvedFloorName : undefined,
        selectedElementIds: scope === "selected" ? selectedElementIds : undefined,
        sections: derivedSections,
        rptFlags: [...rptFlags],
        ideKapak: effectiveIdeKapak,
        metraj: metrajOptions,
        cadModel: model,
        analysis: analysisResult ?? null,
        design: analysisResult?.designResult ?? null,
        deductFormworkOverlaps: true,
        metadata: {
          title: activeSource?.name || model.name || source?.file.name,
          designer: designer.trim() || undefined,
          revisionNote: revisionNote.trim() || undefined,
          dateNote: dateNote.trim() || undefined,
          writeProjectFilename,
          logoDataUrl: logoDataUrl || undefined,
          city: city.trim() || undefined,
          district: district.trim() || undefined,
          usagePurpose: usagePurpose.trim() || undefined,
          pafta: pafta.trim() || undefined,
          ada: ada.trim() || undefined,
          parsel: parsel.trim() || undefined,
          concreteGrade: resolvedConcreteGrade || undefined,
          rebarGrade: resolvedRebarGrade || undefined,
          soilClass: resolvedSoilClass || undefined,
          dts: resolvedDts ?? undefined,
          bys: resolvedBys ?? undefined,
        },
        receiptWarnings: latestReceiptWarnings,
        warningsStatus: latestWarningsStatus,
        profileSha256: latestProfileSha,
        optionsSha256: latestOptionsSha,
      });

      const base = sanitizeFilenameBase(source?.file.name || activeSource?.name || model.name || "statik-rapor");
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-statik-metraj-raporu.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Birleşik statik ve metraj PDF raporu indirildi: ${base}-statik-metraj-raporu.pdf`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "PDF raporu oluşturulamadı.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function startDesktopPreview() {
    if (!source || !sameRevision) {
      setMessage("Yerel ideCAD önizlemesi için kaynak .ide10 dosyasını yeniden açın veya modelin kaynak revizyonuna dönün.");
      return;
    }
    if (!derivedSections.length) {
      setMessage("Yerel ideCAD önizlemesi için en az bir betonarme rapor grubu seçilmelidir.");
      return;
    }
    setSending(true);
    setMessage("");
    setJobId(null);
    setReceipt(null);
    try {
      const sourceHash = await sha(await source.file.arrayBuffer());
      const revision = await sha(new TextEncoder().encode(source.modelSnapshot).buffer as ArrayBuffer);
      if (currentText.current !== source.modelSnapshot) throw new Error("Model değişti; rapor isteği durduruldu.");
      try {
        localStorage.setItem(`hsyncad.ide-source.${revision}`, sourceHash);
      } catch {
        /* Reopen the original file if browser storage is unavailable. */
      }

      const options: {
        scope: "all" | "active_floor";
        analysis: "fresh" | "saved";
        staircaseSmart?: boolean;
        activeFloorName?: string;
        sections: string[];
        ideKapak: boolean;
        rptFlags: boolean[];
      } = {
        scope: resolvedDesktopScope,
        analysis,
        sections: derivedSections,
        ideKapak: effectiveIdeKapak,
        rptFlags: [...rptFlags],
      };

      if (resolvedDesktopScope === "active_floor") options.activeFloorName = resolvedFloorName;
      if (stairs !== "ask") options.staircaseSmart = stairs === "yes";

      const response = await fetch("/api/hsyncad/local-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Hsyncad-Sha256": sourceHash,
          "X-Hsyncad-Revision": revision,
          "X-Hsyncad-Options": asciiJson(options),
        },
        body: source.file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Rapor işi başlatılamadı.");
      setReceipt({
        jobId: data.jobId,
        status: data.status,
        sourceSha256: sourceHash,
        modelRevision: revision,
        reportOptions: options,
        warnings: null,
        warningsStatus: "unknown",
        pdf: "blocked",
      });
      setJobId(data.jobId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Rapor işi başlatılamadı.");
    } finally {
      setSending(false);
    }
  }

  async function reselect(file: File | undefined) {
    if (!file || !model.ideImport || !/\.ide10$/i.test(file.name)) return;
    try {
      const snapshot = modelText;
      const revision = await sha(new TextEncoder().encode(snapshot).buffer as ArrayBuffer);
      const expected = localStorage.getItem(`hsyncad.ide-source.${revision}`);
      if (!expected || (await sha(await file.arrayBuffer())) !== expected || currentText.current !== snapshot) {
        throw new Error("Kaynak dosya eşleşmedi. Orijinal IDE dosyasını yeniden açın.");
      }
      onReselect({ file, modelSnapshot: snapshot, project: model.ideImport.source });
      setMessage("Kaynak dosya hash ile doğrulandı.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Kaynak dosya doğrulanamadı.");
    }
  }

  async function cancelDesktopJob() {
    if (!jobId) return;
    const response = await fetch(`/api/hsyncad/local-report?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("İş iptal edilemedi; durumunu kontrol edin.");
    } else {
      const data = await response.json();
      setMessage(data.status === "closed" ? "İşin önizlemesi kapatıldı." : "İptal isteği gönderildi.");
      if (data.status === "closed") setReceipt(old => (old ? { ...old, status: "closed" } : old));
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ide-report-title"
      className="ide-report-dialog"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="ide-report-titlebar">
        <h2 id="ide-report-title">Statik Rapor Ayarları</h2>
        <button type="button" className="ide-report-close" onClick={onClose} aria-label="Rapor penceresini kapat">
          ×
        </button>
      </header>

      <div className="ide-report-body">
        <div className="ide-report-main-grid">
          {/* LEFT PANEL: Rapor seçimi */}
          <div className="ide-report-left">
            <div className="ide-report-section-label">
              <span>Rapor seçimi :</span>
              <span className="ide-tree-badge ide-tree-badge-count">
                Mevcut: {presenceSummary.presentGroups} grup
                {presenceSummary.omittedSelected > 0 ? ` · ${presenceSummary.omittedSelected} boş grup atlanır` : ""}
              </span>
            </div>
            <div className="ide-report-tree-toolbar">
              <button type="button" className="ide-win-btn-sm" onClick={applyDefaultProfile} disabled={active}>
                Varsayılan Profil
              </button>
              <button type="button" className="ide-win-btn-sm" onClick={() => selectAllTree(true)} disabled={active}>
                Tümünü Seç
              </button>
              <button type="button" className="ide-win-btn-sm" onClick={() => selectAllTree(false)} disabled={active}>
                Tümünü Kaldır
              </button>
              <button type="button" className="ide-win-btn-sm" onClick={toggleAllBranches}>
                Tüm Dalları Aç/Kapat
              </button>
            </div>

            <div className="ide-tree-box" role="tree" aria-label="Statik rapor seçimi ağacı">
              <ul className="ide-tree-list">
                <li>
                  <div className="ide-tree-row">
                    <button
                      type="button"
                      className="ide-tree-expander"
                      aria-label={rootExpanded ? "Raporlar dalını daralt" : "Raporlar dalını genişlet"}
                      onClick={() => setRootExpanded(prev => !prev)}
                    >
                      {rootExpanded ? "-" : "+"}
                    </button>
                    <label className="ide-tree-label">
                      <TriStateCheckbox
                        checked={rootStats.allChecked}
                        indeterminate={rootStats.indeterminate}
                        disabled={active}
                        ariaLabel="Raporlar"
                        onChange={checked => selectAllTree(checked)}
                      />
                      <span className="ide-tree-root-text">Raporlar</span>
                    </label>
                  </div>

                  {rootExpanded && (
                    <ul className="ide-tree-children">
                      {IDE_REPORT_TREE_GROUPS.map(group => {
                        const hasChildren = group.children.length > 0;
                        const isExpanded = Boolean(expandedGroups[group.id]);
                        let checkedCount = 0;
                        if (hasChildren) {
                          for (const c of group.children) {
                            const isChecked = group.rptSupported
                              ? c.treeIdx !== null && Boolean(rptFlags[c.treeIdx])
                              : Boolean(celikLeafFlags[c.id]);
                            if (isChecked) checkedCount += 1;
                          }
                        } else {
                          if (group.parentTreeIdx !== null && rptFlags[group.parentTreeIdx]) checkedCount = 1;
                        }
                        const totalCount = hasChildren ? group.children.length : 1;
                        const groupChecked = checkedCount === totalCount && totalCount > 0;
                        const groupIndeterminate = checkedCount > 0 && checkedCount < totalCount;
                        const gp = presence[group.id];

                        return (
                          <li key={group.id}>
                            <div className="ide-tree-row">
                              {hasChildren ? (
                                <button
                                  type="button"
                                  className="ide-tree-expander"
                                  aria-label={isExpanded ? `${group.label} daralt` : `${group.label} genişlet`}
                                  onClick={() => toggleGroupExpand(group.id)}
                                >
                                  {isExpanded ? "-" : "+"}
                                </button>
                              ) : (
                                <span className="ide-tree-spacer" aria-hidden="true" />
                              )}
                              <label className="ide-tree-label">
                                <TriStateCheckbox
                                  checked={groupChecked}
                                  indeterminate={groupIndeterminate}
                                  disabled={active}
                                  ariaLabel={group.label}
                                  onChange={checked => handleGroupCheck(group.id, group.rptSupported, checked)}
                                />
                                <span className="ide-tree-group-text">{group.label}</span>
                                {gp?.applicable && !gp.present && (
                                  <span className="ide-tree-badge ide-tree-badge-empty">(0 eleman — raporda atlanır)</span>
                                )}
                                {gp?.applicable && gp.present && (
                                  <span className="ide-tree-badge ide-tree-badge-count">({gp.count} eleman)</span>
                                )}
                              </label>
                            </div>

                            {hasChildren && isExpanded && (
                              <ul className="ide-tree-children">
                                {group.children.map(leaf => {
                                  const leafChecked = group.rptSupported
                                    ? leaf.treeIdx !== null && Boolean(rptFlags[leaf.treeIdx])
                                    : Boolean(celikLeafFlags[leaf.id]);
                                  return (
                                    <li key={leaf.id}>
                                      <div className="ide-tree-row">
                                        <span className="ide-tree-spacer" aria-hidden="true" />
                                        <label className="ide-tree-label">
                                          <input
                                            type="checkbox"
                                            checked={leafChecked}
                                            disabled={active}
                                            onChange={e =>
                                              handleLeafCheck(
                                                group.id,
                                                group.rptSupported,
                                                leaf.id,
                                                leaf.treeIdx,
                                                e.target.checked
                                              )
                                            }
                                          />
                                          <span className="ide-tree-leaf-text">{leaf.label}</span>
                                        </label>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}

                      {/* 23rd branch: Metraj Raporu */}
                      <li>
                        <div className="ide-tree-row">
                          <button
                            type="button"
                            className="ide-tree-expander"
                            aria-label={expandedGroups.metraj ? "Metraj Raporu daralt" : "Metraj Raporu genişlet"}
                            onClick={() => toggleGroupExpand("metraj")}
                          >
                            {expandedGroups.metraj ? "-" : "+"}
                          </button>
                          <label className="ide-tree-label">
                            <TriStateCheckbox
                              checked={metrajAllChecked}
                              indeterminate={metrajIndeterminate}
                              disabled={active}
                              ariaLabel="Metraj Raporu (Tek PDF'te Birleştir)"
                              onChange={checked =>
                                setMetrajState({
                                  kalip: checked,
                                  beton: checked,
                                  donati: checked,
                                  detay: checked,
                                })
                              }
                            />
                            <span className="ide-tree-group-text">Metraj Raporu (Tek PDF&apos;te Birleştir)</span>
                          </label>
                        </div>

                        {expandedGroups.metraj && (
                          <ul className="ide-tree-children">
                            {METRAJ_LEAVES.map(leaf => (
                              <li key={leaf.key}>
                                <div className="ide-tree-row">
                                  <span className="ide-tree-spacer" aria-hidden="true" />
                                  <label className="ide-tree-label">
                                    <input
                                      type="checkbox"
                                      checked={metrajState[leaf.key]}
                                      disabled={active}
                                      onChange={e =>
                                        setMetrajState(prev => ({ ...prev, [leaf.key]: e.target.checked }))
                                      }
                                    />
                                    <span className="ide-tree-leaf-text">{leaf.label}</span>
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>

            {!derivedSections.length && !metrajCheckedCount && (
              <p className="ide-tree-alert" role="alert">
                En az 1 statik rapor grubu veya metraj seçeneği seçilmelidir.
              </p>
            )}
          </div>

          {/* MIDDLE-RIGHT FORM + FAR-RIGHT 5 BUTTONS */}
          <div className="ide-report-right-area">
            {/* Row 1 Left: Rapor başlığı */}
            <fieldset className="ide-groupbox">
              <legend>Rapor başlığı :</legend>
              <div className="ide-header-grid">
                <div className="ide-header-fields">
                  <div className="ide-field-row">
                    <label htmlFor="ide-meta-designer">Dizayn :</label>
                    <input
                      id="ide-meta-designer"
                      type="text"
                      className="ide-win-input"
                      value={designer}
                      placeholder="örn. İnş. Müh. Ad Soyad"
                      onChange={e => setDesigner(e.target.value)}
                    />
                  </div>
                  <div className="ide-field-row">
                    <label htmlFor="ide-meta-revision">Revizyon :</label>
                    <input
                      id="ide-meta-revision"
                      type="text"
                      className="ide-win-input"
                      value={revisionNote}
                      placeholder="İsteğe bağlı"
                      onChange={e => setRevisionNote(e.target.value)}
                    />
                  </div>
                  <div className="ide-field-row">
                    <label htmlFor="ide-meta-date">Tarih :</label>
                    <div className="ide-date-wrap">
                      <input
                        id="ide-meta-date"
                        type="text"
                        className="ide-win-input"
                        value={dateNote}
                        placeholder="GG.AA.YYYY"
                        onChange={e => setDateNote(e.target.value)}
                      />
                      <span className="ide-date-picker-btn" title="Tarih seç">
                        📅
                        <input
                          type="date"
                          aria-label="Takvimden tarih seç"
                          className="ide-date-native"
                          onChange={e => {
                            if (e.target.value) setDateNote(isoDateToTr(e.target.value));
                          }}
                        />
                      </span>
                    </div>
                  </div>
                  <label className="ide-checkbox-inline">
                    <input
                      type="checkbox"
                      checked={writeProjectFilename}
                      onChange={e => setWriteProjectFilename(e.target.checked)}
                    />
                    <span>Proje dosyası adını yaz</span>
                  </label>
                </div>

                <div className="ide-logo-panel">
                  <div className="ide-logo-controls">
                    <span>Firma Logosu :</span>
                    <button
                      type="button"
                      className="ide-win-btn-sm"
                      disabled={!logoDataUrl}
                      onClick={() => setLogoDataUrl("")}
                    >
                      Logoyu sil
                    </button>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    className="ide-logo-preview"
                    title="Firma logosu görseli seçmek için tıklayın"
                    onClick={() => logoInputRef.current?.click()}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        logoInputRef.current?.click();
                      }
                    }}
                  >
                    {logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoDataUrl} alt="Firma Logosu" />
                    ) : (
                      <span>Firma Logosu Seçiniz</span>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Firma logosu dosyası seç"
                    onChange={e => {
                      handleLogoUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </fieldset>

            {/* Row 1 Right: Tamam / İptal */}
            <div className="ide-btn-stack">
              <button type="button" className="ide-win-btn" onClick={onClose}>
                Tamam
              </button>
              <button type="button" className="ide-win-btn" onClick={onClose}>
                İptal
              </button>
            </div>

            {/* Row 2 Left: Rapor kapsamı */}
            <fieldset className="ide-groupbox">
              <legend>Rapor kapsamı :</legend>
              <div className="ide-scope-radios">
                <label>
                  <input
                    type="radio"
                    name="ide-report-scope"
                    checked={scope === "all"}
                    onChange={() => setScope("all")}
                    disabled={active}
                  />
                  <span>Tüm proje</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="ide-report-scope"
                    checked={scope === "active_floor"}
                    onChange={() => {
                      setScope("active_floor");
                      if (!selectedFloorName && defaultFloorName) setSelectedFloorName(defaultFloorName);
                    }}
                    disabled={active || !availableFloors.length}
                  />
                  <span>Aktif kat</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="ide-report-scope"
                    checked={scope === "selected"}
                    onChange={() => setScope("selected")}
                    disabled={active}
                  />
                  <span>Seçili elemanlar</span>
                </label>
              </div>

              {scope === "active_floor" && availableFloors.length > 0 && (
                <div className="ide-scope-sub">
                  <label>
                    <span>Hedef kat</span>
                    <select
                      aria-label="Aktif kat seçimi"
                      value={resolvedFloorName}
                      onChange={e => setSelectedFloorName(e.target.value)}
                      disabled={active}
                    >
                      {availableFloors.map(f => (
                        <option key={f.id} value={f.name}>
                          {f.name} ({f.elevation.toFixed(2)} m)
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="ide-scope-note">
                    {source
                      ? `ideCAD’de tam kat adıyla (${resolvedFloorName}) doğrulanır.`
                      : `Seçili kat: ${resolvedFloorName}`}
                  </p>
                </div>
              )}

              {scope === "selected" && (
                <div className="ide-scope-sub">
                  <p className="ide-scope-note">
                    Hsyncad PDF raporunda seçili elemanları süzer ({selectedElementIds.length} seçili eleman); yerel ideCAD masaüstü koşusunda Tüm proje / Aktif kat kullanılır.
                  </p>
                </div>
              )}
            </fieldset>

            {/* Row 2 Right: Rapor Oluştur */}
            <div className="ide-btn-stack ide-btn-stack-middle">
              <button
                type="button"
                className="ide-win-btn ide-win-btn-primary"
                disabled={generatingPdf || (!derivedSections.length && !metrajCheckedCount)}
                onClick={() => void generateCombinedPdf()}
              >
                {generatingPdf ? "Oluşturuluyor..." : "Rapor Oluştur"}
              </button>
            </div>

            {/* Row 3 Left: Yapı bilgileri ve zemin grupları */}
            <fieldset className="ide-groupbox">
              <legend>Yapı bilgileri ve zemin grupları :</legend>
              <div className="ide-building-rows">
                <div className="ide-building-row">
                  <label htmlFor="ide-meta-city">İl / İlçe :</label>
                  <div className="ide-slash-2">
                    <input
                      id="ide-meta-city"
                      type="text"
                      className="ide-win-input"
                      aria-label="İl"
                      value={city}
                      placeholder="İl"
                      onChange={e => setCity(e.target.value)}
                    />
                    <span className="ide-slash-sep">/</span>
                    <input
                      type="text"
                      className="ide-win-input"
                      aria-label="İlçe"
                      value={district}
                      placeholder="İlçe"
                      onChange={e => setDistrict(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ide-building-row">
                  <label htmlFor="ide-meta-usage">Kullanım Amacı :</label>
                  <input
                    id="ide-meta-usage"
                    type="text"
                    className="ide-win-input"
                    value={usagePurpose}
                    placeholder="KONUT"
                    onChange={e => setUsagePurpose(e.target.value)}
                  />
                </div>

                <div className="ide-building-row">
                  <label htmlFor="ide-meta-pafta">Pafta / Ada / Parsel Numaraları :</label>
                  <div className="ide-slash-3">
                    <input
                      id="ide-meta-pafta"
                      type="text"
                      className="ide-win-input"
                      aria-label="Pafta"
                      value={pafta}
                      placeholder="Pafta"
                      onChange={e => setPafta(e.target.value)}
                    />
                    <span className="ide-slash-sep">/</span>
                    <input
                      type="text"
                      className="ide-win-input"
                      aria-label="Ada"
                      value={ada}
                      placeholder="Ada"
                      onChange={e => setAda(e.target.value)}
                    />
                    <span className="ide-slash-sep">/</span>
                    <input
                      type="text"
                      className="ide-win-input"
                      aria-label="Parsel"
                      value={parsel}
                      placeholder="Parsel"
                      onChange={e => setParsel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ide-building-row">
                  <span>Zemin Grubu :</span>
                  <div className="ide-scope-radios" role="radiogroup" aria-label="Zemin Grubu">
                    {(["A", "B", "C", "D"] as const).map(grp => (
                      <label key={grp}>
                        <input
                          type="radio"
                          name="ide-soil-group"
                          checked={soilGroup === grp}
                          onChange={() => setSoilGroup(grp)}
                          disabled={active}
                        />
                        <span>{grp}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Row 3 Right: Kaydet / Yükle (.rpt) */}
            <div className="ide-btn-stack ide-btn-stack-bottom">
              <button type="button" className="ide-win-btn" onClick={saveRptProfile} disabled={active}>
                Kaydet
              </button>
              <button
                type="button"
                className="ide-win-btn"
                onClick={() => rptLoadInputRef.current?.click()}
                disabled={active}
              >
                Yükle
              </button>
              <input
                ref={rptLoadInputRef}
                type="file"
                accept=".rpt"
                hidden
                aria-label="Rapor profili (.rpt) yükle"
                onChange={e => {
                  void loadRptProfile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="ide-report-status-msg" role="status">
            {message}
          </div>
        )}

        {/* BOTTOM SECTION: Local ideCAD 11.28 Desktop Run & Verification */}
        <fieldset className="ide-desktop-box">
          <legend>Yerel ideCAD Statik 11.28 Deneme Masaüstü Koşusu ve Doğrulama</legend>
          <div className="ide-desktop-grid">
            <div className="ide-desktop-field">
              <span className="ide-desktop-title">
                Kaynak: <strong>{source ? source.file.name : "Doğrudan Hsyncad modeli (IDE10 seçilmedi)"}</strong>
              </span>
              <span className="ide-desktop-title">
                {sameRevision
                  ? "Model kaynak revizyonuyla eşleşiyor."
                  : sameModelSnapshot && !isIde10Source
                    ? "PDF üretimi için hazır (.ide11trial/.cde); yerel ideCAD masaüstü önizlemesi yalnızca .ide10 ile çalışır."
                    : source
                      ? "Model değiştiği için kaynak revizyonu eşleşmiyor."
                      : "PDF üretimi için hazır; masaüstü ideCAD önizlemesi için .ide10 açın."}
              </span>
              {!sameRevision && model.ideImport && (
                <label className="ide-reselect-label">
                  Kaynak dosyayı yeniden seç:
                  <input
                    type="file"
                    accept=".ide10"
                    onChange={event => void reselect(event.target.files?.[0])}
                  />
                </label>
              )}
            </div>

            <div className="ide-desktop-field">
              <label htmlFor="ide-desktop-analysis">Analiz</label>
              <select
                id="ide-desktop-analysis"
                aria-label="Analiz"
                value={analysis}
                onChange={e => setAnalysis(e.target.value as "fresh" | "saved")}
                disabled={active}
              >
                <option value="fresh">Yeniden analiz (F9)</option>
                <option value="saved">Kayıtlı sonuçları kullan</option>
              </select>
            </div>

            <div className="ide-desktop-field">
              <label htmlFor="ide-desktop-stairs">Merdiven akıllı bağlantısı</label>
              <select
                id="ide-desktop-stairs"
                aria-label="Merdiven akıllı bağlantısı"
                value={stairs}
                onChange={e => setStairs(e.target.value as "ask" | "yes" | "no")}
                disabled={active || analysis !== "fresh"}
              >
                <option value="ask">Sorulursa işlemi durdur</option>
                <option value="no">Hayır</option>
                <option value="yes">Evet</option>
              </select>
            </div>

            <div className="ide-desktop-actions">
              <button
                type="button"
                className="ide-win-btn"
                onClick={() => void startDesktopPreview()}
                disabled={
                  !sameRevision ||
                  !derivedSections.length ||
                  active ||
                  receipt?.status === "ready" ||
                  receipt?.status === "preview_closed_or_stale"
                }
              >
                ideCAD Önizlemesini Aç
              </button>
              {active && jobId && (
                <button type="button" className="ide-win-btn" onClick={() => void cancelDesktopJob()}>
                  İptal et
                </button>
              )}
              {receipt && ["ready", "preview_closed_or_stale", "preview_unknown"].includes(receipt.status) && (
                <button type="button" className="ide-win-btn" onClick={() => void cancelDesktopJob()}>
                  İşi kapat
                </button>
              )}
            </div>
          </div>

          {receipt && (
            <div className="ide-desktop-meta">
              <span role="status">
                <strong>Durum:</strong> {titles[receipt.status] ?? receipt.status} · ideRAPOR doğrudan PDF kaydı:{" "}
                <code>{receipt.pdf}</code>
              </span>
              <p className="ide-report-hashes">
                Kaynak SHA-256: <code>{receipt.sourceSha256}</code> · Model revizyonu: <code>{receipt.modelRevision}</code>
                {receipt.profileSha256 && (
                  <>
                    {" "}
                    · Profil SHA-256: <code>{receipt.profileSha256}</code>
                  </>
                )}
                {receipt.optionsSha256 && (
                  <>
                    {" "}
                    · Seçenek SHA-256: <code>{receipt.optionsSha256}</code>
                  </>
                )}
              </p>
              {receipt.status === "ready" && !optionsMatchPreview && (
                <span role="alert">Seçimler açık önizlemeden farklı; ideCAD önizlemesini güncellemek için işi kapatıp yeniden açın.</span>
              )}
              {receipt.warnings?.map(w => (
                <span key={w}>{w}</span>
              ))}
              {receipt.error && <span role="alert">{receipt.error}</span>}
            </div>
          )}
        </fieldset>
      </div>
    </dialog>
  );
}
