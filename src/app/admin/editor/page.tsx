"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Blocks,
  BookOpen,
  BookType,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  Eye,
  FileCode2,
  FileJson2,
  GripVertical,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  Minus,
  PencilLine,
  Plus,
  Quote,
  Save,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Table,
  Trash2,
  Type,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACCENT_OPTIONS,
  ADMIN_AUTH_STORAGE_KEY,
  ADMIN_PASSWORD,
  BLOCK_LIBRARY,
  DEFAULT_WORKSPACE_PREFERENCES,
  EDITOR_DRAFT_STORAGE_KEY,
  LAST_EDITED_ARTICLE_KEY,
  PREVIEW_SURFACE_OPTIONS,
  SECTION_PRESETS,
  TEMPLATE_PRESETS,
  WORKSPACE_PREFS_STORAGE_KEY,
  applyTemplate,
  calculateReadTime,
  createBlock,
  createEmptyArticle,
  createEmptySection,
  duplicateArticle,
  getWordCount,
  parseReadTime,
  slugify,
  toEditorArticle,
  toStoredArticle,
  type EditorArticle,
  type StoredArticle,
  type WorkspacePreferences,
} from "@/lib/admin-editor";
import { SITE_SECTIONS, type SiteSectionId } from "@/lib/site-sections";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/blocks-to-content";

type SidebarTab = "outline" | "templates" | "blocks";
type InspectorTab = "publish" | "relations" | "seo" | "workspace" | "preview";

interface DraftSnapshot {
  article: EditorArticle;
  savedAt: string;
  sourceSlug?: string | null;
}

const FIELD_CLASS =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--editor-accent-solid)] focus:ring-4 focus:ring-[color:var(--editor-accent-soft)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";

const PANEL_CLASS =
  "rounded-[28px] border border-white/70 bg-white/92 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/88";

const BLOCK_ICONS: Record<Block["type"], typeof Type> = {
  paragraph: Type,
  heading: BookType,
  image: ImageIcon,
  code: FileCode2,
  callout: AlertTriangle,
  "link-embed": Link2,
  list: List,
  quote: Quote,
  divider: Minus,
  table: Table,
};

const CALLOUT_VARIANTS = [
  { value: "not", label: "Not" },
  { value: "bilgi", label: "Bilgi" },
  { value: "ipucu", label: "İpucu" },
  { value: "uyari", label: "Uyarı" },
] as const;

function readDraftSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DraftSnapshot>;
    if (!parsed.article) {
      return null;
    }

    return {
      article: toEditorArticle(parsed.article),
      savedAt: parsed.savedAt || "",
      sourceSlug: parsed.sourceSlug || null,
    } satisfies DraftSnapshot;
  } catch {
    return null;
  }
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
      <span>{children}</span>
      {hint ? <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400">{hint}</span> : null}
    </label>
  );
}

function renderPreviewBlock(block: Block) {
  if (block.type === "paragraph") {
    return <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{block.content}</p>;
  }

  if (block.type === "heading") {
    return <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{block.content}</h3>;
  }

  if (block.type === "image") {
    return block.src ? (
      <figure className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative aspect-[16/9]">
          <Image src={block.src} alt={block.alt || ""} fill className="object-cover" unoptimized />
        </div>
        {block.caption ? <figcaption className="border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500 dark:border-zinc-800">{block.caption}</figcaption> : null}
      </figure>
    ) : (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        Görsel URL adresi eklenmedi
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-sm">
        <div className="border-b border-zinc-800 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">{block.lang || "Kod"}</div>
        <pre className="overflow-x-auto p-5 text-xs leading-6 text-emerald-300">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  if (block.type === "callout") {
    const variants: Record<string, string> = {
      not: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100",
      bilgi: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
      ipucu: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100",
      uyari: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
    };

    return <div className={cn("rounded-3xl border px-5 py-5 text-sm leading-7", variants[block.variant || "not"] || variants.not)}>{block.content}</div>;
  }

  if (block.type === "link-embed") {
    return (
      <a
        href={block.url || "#"}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm font-bold transition hover:border-[color:var(--editor-accent-border)] hover:bg-[color:var(--editor-accent-soft)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <span>{block.title || block.url || "Harici bağlantı"}</span>
        <Link2 className="h-4 w-4 text-zinc-400" />
      </a>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag className={cn("space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300", block.ordered ? "list-decimal" : "list-disc")}>
        {(block.items || []).filter(Boolean).map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "quote") {
    return <blockquote className="rounded-r-3xl border-l-4 border-[color:var(--editor-accent-solid)] bg-zinc-50 px-5 py-5 text-base font-semibold italic leading-8 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">{block.content}</blockquote>;
  }

  if (block.type === "divider") {
    return <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <tbody>
          {(block.rows || []).map((row, rowIndex) => (
            <tr key={`${rowIndex}`} className={rowIndex === 0 ? "bg-zinc-50 font-bold dark:bg-zinc-900" : "bg-white dark:bg-zinc-950"}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="border-r border-b border-zinc-200 px-4 py-3 last:border-r-0 dark:border-zinc-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewPane({ article, surface }: { article: EditorArticle; surface: WorkspacePreferences["previewSurface"] }) {
  const surfaceClass = PREVIEW_SURFACE_OPTIONS.find((item) => item.id === surface)?.className ?? PREVIEW_SURFACE_OPTIONS[0].className;

  return (
    <div className={cn("rounded-[32px] border border-zinc-200 p-6 shadow-sm dark:border-zinc-800", surfaceClass)}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap gap-2">
          <Badge className={cn("border-none px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]", article.categoryColor)}>{article.category}</Badge>
          <Badge variant="outline" className="border-zinc-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] dark:border-zinc-700">
            {article.badgeLabel}
          </Badge>
        </div>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">{article.title || "Başlıksız içerik"}</h1>
        <p className="mt-5 text-base leading-8 text-zinc-500 dark:text-zinc-400">{article.description || "Kısa açıklama burada görünecek."}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">{article.author}</span>
          <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">{article.authorTitle}</span>
          <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">{article.date}</span>
          <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">{article.readTime}</span>
        </div>
        {article.image ? <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[32px] border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"><Image src={article.image} alt={article.title || "Kapak"} fill className="object-cover" unoptimized /></div> : null}
        {article.quote.text ? <div className="mt-10 rounded-r-[32px] border-l-8 border-[color:var(--editor-accent-solid)] bg-zinc-50 px-8 py-8 text-2xl font-black italic leading-relaxed text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">“{article.quote.text}”</div> : null}
        <div className="mt-12 space-y-12">
          {article.sections.map((section, sectionIndex) => (
            <section key={`${section.id}-${sectionIndex}`} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Bölüm {sectionIndex + 1}</p>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">{section.title}</h2>
              </div>
              <div className="space-y-6">{section.blocks.map((block) => <div key={block.id}>{renderPreviewBlock(block)}</div>)}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (nextBlock: Block) => void }) {
  if (block.type === "paragraph") {
    return <textarea value={block.content || ""} onChange={(event) => onChange({ ...block, content: event.target.value })} className={cn(FIELD_CLASS, "min-h-[140px] resize-y")} placeholder="Paragraf içeriğini buraya yazın." />;
  }

  if (block.type === "heading") {
    return (
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
        <Input value={block.content || ""} onChange={(event) => onChange({ ...block, content: event.target.value })} className={cn(FIELD_CLASS, "h-12 font-bold")} placeholder="Alt başlık" />
        <Select value={String(block.level || 3)} onValueChange={(value) => onChange({ ...block, level: Number(value) })}>
          <SelectTrigger className="h-12 w-full rounded-2xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <SelectValue placeholder="Seviye" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
            <SelectItem value="4">H4</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="space-y-3">
        <Input value={block.src || ""} onChange={(event) => onChange({ ...block, src: event.target.value })} className={cn(FIELD_CLASS, "h-12 font-mono text-xs")} placeholder="https://..." />
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={block.alt || ""} onChange={(event) => onChange({ ...block, alt: event.target.value })} className="h-11 rounded-2xl" placeholder="Alt metin" />
          <Input value={block.caption || ""} onChange={(event) => onChange({ ...block, caption: event.target.value })} className="h-11 rounded-2xl" placeholder="Açıklama" />
        </div>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="space-y-3">
        <Input value={block.lang || ""} onChange={(event) => onChange({ ...block, lang: event.target.value })} className={cn(FIELD_CLASS, "h-11 max-w-[220px] font-mono text-xs")} placeholder="typescript" />
        <textarea value={block.content || ""} onChange={(event) => onChange({ ...block, content: event.target.value })} className="min-h-[180px] w-full resize-y rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-4 font-mono text-xs leading-6 text-emerald-300 outline-none transition focus:border-[color:var(--editor-accent-solid)] focus:ring-4 focus:ring-[color:var(--editor-accent-soft)]" placeholder="Kod örneğini buraya yazın." />
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CALLOUT_VARIANTS.map((variant) => (
            <button key={variant.value} type="button" onClick={() => onChange({ ...block, variant: variant.value })} className={cn("rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition", block.variant === variant.value ? "bg-[color:var(--editor-accent-solid)] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")}>
              {variant.label}
            </button>
          ))}
        </div>
        <textarea value={block.content || ""} onChange={(event) => onChange({ ...block, content: event.target.value })} className={cn(FIELD_CLASS, "min-h-[120px] resize-y")} placeholder="Vurgulamak istediğiniz not." />
      </div>
    );
  }

  if (block.type === "link-embed") {
    return (
      <div className="grid gap-3">
        <Input value={block.title || ""} onChange={(event) => onChange({ ...block, title: event.target.value })} className="h-11 rounded-2xl" placeholder="Kart başlığı" />
        <Input value={block.url || ""} onChange={(event) => onChange({ ...block, url: event.target.value })} className={cn(FIELD_CLASS, "h-11 font-mono text-xs")} placeholder="https://..." />
      </div>
    );
  }

  if (block.type === "list") {
    const items = block.items || [""];

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange({ ...block, ordered: false })} className={cn("rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition", !block.ordered ? "bg-[color:var(--editor-accent-solid)] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")}>Sırasız</button>
          <button type="button" onClick={() => onChange({ ...block, ordered: true })} className={cn("rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition", block.ordered ? "bg-[color:var(--editor-accent-solid)] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")}>Sıralı</button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${block.id}-${index}`} className="flex items-center gap-2">
              <span className="w-8 text-center text-xs font-black text-zinc-400">{block.ordered ? `${index + 1}.` : "•"}</span>
              <Input
                value={item}
                onChange={(event) => {
                  const nextItems = [...items];
                  nextItems[index] = event.target.value;
                  onChange({ ...block, items: nextItems });
                }}
                className="h-11 rounded-2xl"
                placeholder="Liste maddesi"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange({ ...block, items: items.filter((_, itemIndex) => itemIndex !== index).length > 0 ? items.filter((_, itemIndex) => itemIndex !== index) : [""] })}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChange({ ...block, items: [...items, ""] })}>
          <Plus className="h-4 w-4" />
          Yeni madde
        </Button>
      </div>
    );
  }

  if (block.type === "quote") {
    return <textarea value={block.content || ""} onChange={(event) => onChange({ ...block, content: event.target.value })} className={cn(FIELD_CLASS, "min-h-[120px] resize-y italic")} placeholder="Alıntı veya vurgu cümlesi." />;
  }

  if (block.type === "divider") {
    return <div className="rounded-3xl border border-dashed border-zinc-300 px-6 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">Ayraç bloğu içeriğe ritim kazandırır.</div>;
  }

  const rows = block.rows || [["Başlık", "Değer"], ["", ""]];
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[420px] text-sm">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${block.id}-${rowIndex}`} className={rowIndex === 0 ? "bg-zinc-50 dark:bg-zinc-900" : "bg-white dark:bg-zinc-950"}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="border-r border-b border-zinc-200 p-0 last:border-r-0 dark:border-zinc-800">
                    <input
                      value={cell}
                      onChange={(event) => {
                        const nextRows = rows.map((currentRow) => [...currentRow]);
                        nextRows[rowIndex][cellIndex] = event.target.value;
                        onChange({ ...block, rows: nextRows });
                      }}
                      className="w-full bg-transparent px-4 py-3 outline-none focus:bg-[color:var(--editor-accent-soft)]"
                      placeholder={rowIndex === 0 ? "Başlık" : "Değer"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChange({ ...block, rows: [...rows, new Array(rows[0]?.length || 2).fill("")] })}>
          <Plus className="h-4 w-4" />
          Satır
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChange({ ...block, rows: rows.map((row) => [...row, ""]) })}>
          <Plus className="h-4 w-4" />
          Sütun
        </Button>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("outline");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("publish");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [article, setArticle] = useState<EditorArticle>(() => createEmptyArticle());
  const [workspace, setWorkspace] = useState<WorkspacePreferences>(DEFAULT_WORKSPACE_PREFERENCES);
  const [existingArticles, setExistingArticles] = useState<StoredArticle[]>([]);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [draftSnapshot, setDraftSnapshot] = useState<DraftSnapshot | null>(null);
  const [relatedQuery, setRelatedQuery] = useState("");
  const [jsonBuffer, setJsonBuffer] = useState("");

  const accent = useMemo(() => ACCENT_OPTIONS.find((item) => item.id === workspace.accentId) ?? ACCENT_OPTIONS[0], [workspace.accentId]);
  const pageStyle = useMemo(
    () =>
      ({
        "--editor-accent-solid": accent.solid,
        "--editor-accent-soft": accent.soft,
        "--editor-accent-border": accent.border,
        "--editor-accent-text": accent.text,
        "--editor-accent-glow": accent.glow,
      } as CSSProperties),
    [accent],
  );

  const articleStats = useMemo(() => {
    const blocks = article.sections.flatMap((section) => section.blocks);
    return {
      words: getWordCount(article),
      sections: article.sections.length,
      blocks: blocks.length,
      images: blocks.filter((block) => block.type === "image" && block.src).length,
      tables: blocks.filter((block) => block.type === "table").length,
      readTime: parseReadTime(article.readTime),
    };
  }, [article]);

  const seoChecklist = useMemo(() => {
    const titleLength = article.title.trim().length;
    const descriptionLength = article.description.trim().length;
    return [
      { label: "Başlık uzunluğu", status: titleLength >= 40 && titleLength <= 72, detail: `${titleLength} karakter` },
      { label: "Açıklama uzunluğu", status: descriptionLength >= 120 && descriptionLength <= 180, detail: `${descriptionLength} karakter` },
      { label: "Kapak görseli", status: Boolean(article.image.trim()), detail: article.image.trim() ? "Hazır" : "Eksik" },
      { label: "Bölüm sayısı", status: article.sections.length >= 3, detail: `${article.sections.length} bölüm` },
      { label: "İlgili içerik", status: article.relatedSlugs.length > 0, detail: `${article.relatedSlugs.length} bağlantı` },
    ];
  }, [article]);

  const relatedCandidates = useMemo(() => {
    const query = relatedQuery.trim().toLocaleLowerCase("tr-TR");
    return existingArticles
      .filter((candidate) => candidate.slug !== article.slug)
      .filter((candidate) => (!query ? true : `${candidate.title} ${candidate.slug} ${candidate.category}`.toLocaleLowerCase("tr-TR").includes(query)));
  }, [existingArticles, article.slug, relatedQuery]);

  const applyAutoRules = useCallback((candidate: EditorArticle) => {
    let next = candidate;

    if (workspace.autoSlug) {
      const generatedSlug = slugify(candidate.title || candidate.slug || "");
      if (generatedSlug && generatedSlug !== next.slug) {
        next = { ...next, slug: generatedSlug };
      }
    }

    if (workspace.autoReadTime) {
      const generatedReadTime = calculateReadTime(candidate);
      if (generatedReadTime !== next.readTime) {
        next = { ...next, readTime: generatedReadTime };
      }
    }
    return next;
  }, [workspace.autoReadTime, workspace.autoSlug]);

  function commitArticle(updater: (current: EditorArticle) => EditorArticle) {
    setArticle((current) => applyAutoRules(updater(current)));
    setHasUnsavedChanges(true);
  }

  const loadArticle = useCallback((nextArticle: EditorArticle, nextLoadedSlug: string | null) => {
    setArticle(applyAutoRules(nextArticle));
    setLoadedSlug(nextLoadedSlug);
    setSelectedSectionIndex(0);
    setHasUnsavedChanges(false);
  }, [applyAutoRules]);

  const fetchArticlesAndBoot = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/articles");
      if (!response.ok) {
        throw new Error("İçerik listesi alınamadı.");
      }

      const data = (await response.json()) as Record<string, Partial<StoredArticle>>;
      const normalizedArticles = Object.values(data).map((item) => toStoredArticle(toEditorArticle(item)));
      setExistingArticles(normalizedArticles);

      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get("edit");
      const duplicateSlug = params.get("duplicate");
      const templateId = params.get("template");
      const restoreDraft = params.get("draft") === "1";
      const snapshot = readDraftSnapshot();
      setDraftSnapshot(snapshot);

      if (editSlug && data[editSlug]) {
        loadArticle(toEditorArticle(data[editSlug]), editSlug);
      } else if (duplicateSlug && data[duplicateSlug]) {
        loadArticle(duplicateArticle(toEditorArticle(data[duplicateSlug])), null);
      } else if (restoreDraft && snapshot) {
        loadArticle(toEditorArticle(snapshot.article), snapshot.sourceSlug || null);
      } else if (templateId && TEMPLATE_PRESETS.some((item) => item.id === templateId)) {
        loadArticle(applyTemplate(templateId as (typeof TEMPLATE_PRESETS)[number]["id"]), null);
      } else {
        loadArticle(createEmptyArticle(), null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Editör açılırken içerikler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [loadArticle]);

  useEffect(() => {
    const storedAuth = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    const storedPrefs = localStorage.getItem(WORKSPACE_PREFS_STORAGE_KEY);

    if (storedPrefs) {
      try {
        setWorkspace({ ...DEFAULT_WORKSPACE_PREFERENCES, ...(JSON.parse(storedPrefs) as Partial<WorkspacePreferences>) });
      } catch {
        setWorkspace(DEFAULT_WORKSPACE_PREFERENCES);
      }
    }

    setDraftSnapshot(readDraftSnapshot());
    if (!ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthChecked(true);
      return;
    }

    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsLoading(false);
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchArticlesAndBoot();
    }
  }, [fetchArticlesAndBoot, isAuthenticated]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    localStorage.setItem(WORKSPACE_PREFS_STORAGE_KEY, JSON.stringify(workspace));
    setArticle((current) => applyAutoRules(current));
  }, [workspace, authChecked, applyAutoRules]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const snapshot: DraftSnapshot = { article, savedAt: new Date().toISOString(), sourceSlug: loadedSlug };
      localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
      setDraftSnapshot(snapshot);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [article, isAuthenticated, isLoading, loadedSlug]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
      if (modifier && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setInspectorTab("preview");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return;
    }

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      toast.success("Editör erişimi açıldı.");
      return;
    }
    toast.error("Şifre hatalı.");
  }

  function handleLogout() {
    setIsAuthenticated(false);
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setPassword("");
  }

  function scrollToSection(index: number) {
    document.getElementById(`editor-section-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applySectionPreset(sectionId: SiteSectionId) {
    const preset = SECTION_PRESETS.find((item) => item.sectionId === sectionId) ?? SECTION_PRESETS[0];
    commitArticle((current) => ({ ...current, sectionId, category: preset.category, categoryColor: preset.categoryColor, badgeLabel: preset.badgeLabel, authorTitle: preset.authorTitle }));
  }

  function addSection() {
    commitArticle((current) => ({ ...current, sections: [...current.sections, createEmptySection(current.sections.length + 1)] }));
    setSelectedSectionIndex(article.sections.length);
  }

  function duplicateSection(index: number) {
    commitArticle((current) => {
      const nextSections = [...current.sections];
      const section = current.sections[index];
      nextSections.splice(index + 1, 0, { id: `${section.id}-kopya`, title: `${section.title} (Kopya)`, blocks: section.blocks.map((block) => ({ ...block, id: createBlock(block.type).id })) });
      return { ...current, sections: nextSections };
    });
  }

  function moveSection(index: number, direction: "up" | "down") {
    commitArticle((current) => {
      const nextSections = [...current.sections];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= nextSections.length) {
        return current;
      }
      [nextSections[index], nextSections[target]] = [nextSections[target], nextSections[index]];
      return { ...current, sections: nextSections };
    });
    setSelectedSectionIndex(direction === "up" ? Math.max(0, index - 1) : Math.min(article.sections.length - 1, index + 1));
  }

  function removeSection(index: number) {
    if (article.sections.length === 1) {
      toast.error("En az bir bölüm bulunmalı.");
      return;
    }
    commitArticle((current) => ({ ...current, sections: current.sections.filter((_, itemIndex) => itemIndex !== index) }));
    setSelectedSectionIndex(Math.max(0, index - 1));
  }

  function addBlockToSection(sectionIndex: number, type: Block["type"]) {
    commitArticle((current) => ({
      ...current,
      sections: current.sections.map((section, itemIndex) => (itemIndex === sectionIndex ? { ...section, blocks: [...section.blocks, createBlock(type)] } : section)),
    }));
  }

  function moveBlock(sectionIndex: number, blockIndex: number, direction: "up" | "down") {
    commitArticle((current) => {
      const nextSections = [...current.sections];
      const blocks = [...nextSections[sectionIndex].blocks];
      const target = direction === "up" ? blockIndex - 1 : blockIndex + 1;
      if (target < 0 || target >= blocks.length) {
        return current;
      }
      [blocks[blockIndex], blocks[target]] = [blocks[target], blocks[blockIndex]];
      nextSections[sectionIndex] = { ...nextSections[sectionIndex], blocks };
      return { ...current, sections: nextSections };
    });
  }

  async function handleSave() {
    const prepared = toStoredArticle(applyAutoRules(article));
    if (!prepared.slug || !prepared.title || !prepared.description) {
      toast.error("Başlık, slug ve açıklama alanları zorunlu.");
      setInspectorTab("publish");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prepared) });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Kayıt başarısız.");
      }
      if (loadedSlug && loadedSlug !== prepared.slug) {
        await fetch(`/api/articles?slug=${loadedSlug}`, { method: "DELETE" });
      }
      localStorage.setItem(LAST_EDITED_ARTICLE_KEY, prepared.slug);
      localStorage.removeItem(EDITOR_DRAFT_STORAGE_KEY);
      setDraftSnapshot(null);
      window.history.replaceState({}, "", `/admin/editor?edit=${prepared.slug}`);
      loadArticle(toEditorArticle(prepared), prepared.slug);
      toast.success("İçerik kaydedildi.");
      await fetchArticlesAndBoot();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "İçerik kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(toStoredArticle(article), null, 2));
    toast.success("JSON panoya kopyalandı.");
  }

  async function copyMarkdown() {
    const markdown = article.sections.map((section) => [`## ${section.title}`, ...toStoredArticle({ ...article, sections: [section] }).sections.map((item) => item.content)].join("\n\n")).join("\n\n");
    await navigator.clipboard.writeText(markdown);
    toast.success("Markdown panoya kopyalandı.");
  }

  if (!authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_24%),linear-gradient(180deg,#edf4ff_0%,#f7fafc_60%,#fbfbfd_100%)] px-4 py-20 dark:bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.25),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.22),transparent_24%),linear-gradient(180deg,#050b15_0%,#09111e_60%,#09111e_100%)]">
        <div className="mx-auto max-w-md rounded-[32px] border border-white/70 bg-white/92 p-8 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(29,78,216,0.12)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300"><Shield className="h-4 w-4" />Admin editör</span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">Yeni editör çalışma alanı</h1>
                <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">Şablon, blok, canlı önizleme, taslak otomasyonu ve yayın ayarları tek ekranda.</p>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><Sparkles className="h-6 w-6" /></div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-2xl" placeholder="Şifre" />
            <Button type="submit" className="h-12 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">Editöre gir</Button>
          </form>
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 px-4 py-4 text-xs leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Local kullanım için <span className="font-black text-zinc-950 dark:text-zinc-100">NEXT_PUBLIC_ADMIN_PASSWORD</span> tanımlayabilirsiniz.
            Değer boşsa geliştirme ortamında erişim doğrudan açılır.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle} className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.14),transparent_24%),linear-gradient(180deg,#edf4ff_0%,#f5f7fb_50%,#fcfcfd_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_24%),linear-gradient(180deg,#050b15_0%,#08111e_50%,#09111e_100%)]">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6">
        <div className={cn(PANEL_CLASS, "overflow-hidden p-6 md:p-8")}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border-none bg-[color:var(--editor-accent-soft)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--editor-accent-text)]">Editor studio</Badge>
                <Badge variant="outline" className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">{SITE_SECTIONS.find((section) => section.id === article.sectionId)?.title || "Bölüm seçilmedi"}</Badge>
                <Badge variant="outline" className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">{hasUnsavedChanges ? "Kaydedilmemiş değişiklik var" : "Tüm değişiklikler senkron"}</Badge>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-4xl">Tam özellikli yönetim editörü</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">Şablonlarla başla, bloklarla üret, sağ panelden yayın ayarlarını ve SEO kontrolünü yönet.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Kelime</p><p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{articleStats.words}</p></div>
                <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Bölüm</p><p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{articleStats.sections}</p></div>
                <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Blok</p><p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{articleStats.blocks}</p></div>
                <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/70"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Okuma</p><p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">{articleStats.readTime} dk</p></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href="/admin"><ArrowLeft className="h-4 w-4" />Yönetim paneli</Link></Button>
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => { window.history.replaceState({}, "", "/admin/editor"); loadArticle(createEmptyArticle(), null); setJsonBuffer(""); }}><PencilLine className="h-4 w-4" />Yeni içerik</Button>
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => setInspectorTab("preview")}><Eye className="h-4 w-4" />Canlı önizleme</Button>
              <Button type="button" className="h-11 rounded-2xl px-6" onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Kaydet</Button>
              <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={handleLogout}><X className="h-4 w-4" />Çıkış</Button>
            </div>
          </div>
        </div>
        {draftSnapshot ? (
          <div className={cn(PANEL_CLASS, "flex flex-col gap-3 px-5 py-5 text-sm text-zinc-700 dark:text-zinc-200 lg:flex-row lg:items-center lg:justify-between")}>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--editor-accent-text)]">Otomatik taslak hazır</p>
              <p className="mt-2 leading-7">{draftSnapshot.savedAt ? new Date(draftSnapshot.savedAt).toLocaleString("tr-TR") : "Yakın zamanda"} kaydı bulundu.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => { if (draftSnapshot) { loadArticle(toEditorArticle(draftSnapshot.article), draftSnapshot.sourceSlug || null); setHasUnsavedChanges(true); } }}>Taslağı yükle</Button>
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => { localStorage.removeItem(EDITOR_DRAFT_STORAGE_KEY); setDraftSnapshot(null); }}>Taslağı temizle</Button>
            </div>
          </div>
        ) : null}
        {isLoading ? (
          <div className={cn(PANEL_CLASS, "flex min-h-[420px] items-center justify-center p-10")}><Loader2 className="h-8 w-8 animate-spin text-[color:var(--editor-accent-solid)]" /></div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_400px]">
            <aside className={cn(PANEL_CLASS, "overflow-hidden")}>
              <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as SidebarTab)} className="h-full">
                <TabsList className="mx-5 mt-5 grid grid-cols-3 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
                  <TabsTrigger value="outline" className="rounded-xl"><BookOpen className="h-4 w-4" />Outline</TabsTrigger>
                  <TabsTrigger value="templates" className="rounded-xl"><LayoutTemplate className="h-4 w-4" />Şablon</TabsTrigger>
                  <TabsTrigger value="blocks" className="rounded-xl"><Blocks className="h-4 w-4" />Blok</TabsTrigger>
                </TabsList>
                <TabsContent value="outline" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5">
                    <div className="space-y-3">
                      {article.sections.map((section, index) => (
                        <button key={`${section.id}-${index}`} type="button" onClick={() => { setSelectedSectionIndex(index); scrollToSection(index); }} className={cn("flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition", selectedSectionIndex === index ? "border-[color:var(--editor-accent-border)] bg-[color:var(--editor-accent-soft)]" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950")}>
                          <span>
                            <span className="block text-sm font-black text-zinc-950 dark:text-zinc-50">{section.title || `Bölüm ${index + 1}`}</span>
                            <span className="block text-[11px] uppercase tracking-[0.2em] text-zinc-400">{section.blocks.length} blok</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="templates" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5">
                    <div className="space-y-3">
                      {TEMPLATE_PRESETS.map((template) => (
                        <button key={template.id} type="button" onClick={() => { if (!hasUnsavedChanges || window.confirm("Mevcut içerik şablon ile değişecek. Devam edilsin mi?")) { loadArticle(applyTemplate(template.id), null); setHasUnsavedChanges(true); } }} className="w-full rounded-[24px] border border-zinc-200 bg-white px-4 py-4 text-left transition hover:border-[color:var(--editor-accent-border)] hover:bg-[color:var(--editor-accent-soft)] dark:border-zinc-800 dark:bg-zinc-950">
                          <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{template.label}</p>
                          <p className="mt-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="blocks" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5">
                    <div className="space-y-3">
                      {BLOCK_LIBRARY.map((item) => {
                        const Icon = BLOCK_ICONS[item.type];
                        return (
                          <button key={item.type} type="button" onClick={() => addBlockToSection(selectedSectionIndex, item.type)} className="flex w-full items-start gap-3 rounded-[24px] border border-zinc-200 bg-white px-4 py-4 text-left transition hover:border-[color:var(--editor-accent-border)] hover:bg-[color:var(--editor-accent-soft)] dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><Icon className="h-5 w-5 text-[color:var(--editor-accent-solid)]" /></div>
                            <div><p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{item.label}</p><p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </aside>
            <main className="space-y-6">
              <div className={cn(PANEL_CLASS, "p-6 md:p-8")}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="space-y-5">
                    <div>
                      <FieldLabel hint={`${article.title.length}/72`}>Makale başlığı</FieldLabel>
                      <Input value={article.title} onChange={(event) => commitArticle((current) => ({ ...current, title: event.target.value }))} className={cn(FIELD_CLASS, "h-14 text-2xl font-black tracking-tight md:text-3xl")} placeholder="Makale başlığını yazın" />
                    </div>
                    <div>
                      <FieldLabel hint={`${article.description.length}/180`}>Özet metin</FieldLabel>
                      <textarea value={article.description} onChange={(event) => commitArticle((current) => ({ ...current, description: event.target.value }))} className={cn(FIELD_CLASS, "min-h-[140px] resize-y")} placeholder="Kartlar ve SEO için kısa açıklama" />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <FieldLabel>Kapak görseli</FieldLabel>
                      <Input value={article.image} onChange={(event) => commitArticle((current) => ({ ...current, image: event.target.value }))} className={cn(FIELD_CLASS, "h-11 font-mono text-xs")} placeholder="https://... veya /covers/..." />
                    </div>
                    <div className="relative h-[220px] overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">{article.image ? <Image src={article.image} alt={article.title || "Kapak"} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-sm text-zinc-400">Kapak önizlemesi</div>}</div>
                  </div>
                </div>
              </div>
              {article.sections.map((section, sectionIndex) => (
                <div key={`${section.id}-${sectionIndex}`} id={`editor-section-${sectionIndex}`} className={cn(PANEL_CLASS, "p-5 md:p-6", selectedSectionIndex === sectionIndex ? "ring-2 ring-[color:var(--editor-accent-border)]" : "")}>
                  <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                      <button type="button" className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900" onClick={() => { setSelectedSectionIndex(sectionIndex); scrollToSection(sectionIndex); }}><GripVertical className="h-4 w-4" /></button>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
                          <Input value={section.id} onChange={(event) => commitArticle((current) => ({ ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, id: event.target.value } : item) }))} className={cn(FIELD_CLASS, "h-11 font-mono text-xs")} placeholder="url-id" />
                          <Input value={section.title} onChange={(event) => commitArticle((current) => ({ ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, title: event.target.value } : item) }))} className={cn(FIELD_CLASS, "h-11 font-bold")} placeholder="Bölüm başlığı" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => moveSection(sectionIndex, "up")} disabled={sectionIndex === 0}><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => moveSection(sectionIndex, "down")} disabled={sectionIndex === article.sections.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => duplicateSection(sectionIndex)}><Copy className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="sm" className="rounded-full text-red-600" onClick={() => removeSection(sectionIndex)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {section.blocks.map((block, blockIndex) => {
                      const Icon = BLOCK_ICONS[block.type];
                      return (
                        <div key={block.id} className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75 md:p-5">
                          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><Icon className="h-5 w-5 text-[color:var(--editor-accent-solid)]" /></div>
                              <div><p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{BLOCK_LIBRARY.find((item) => item.type === block.type)?.label || block.type}</p><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Blok {blockIndex + 1}</p></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => moveBlock(sectionIndex, blockIndex, "up")} disabled={blockIndex === 0}><ArrowUp className="h-4 w-4" /></Button>
                              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => moveBlock(sectionIndex, blockIndex, "down")} disabled={blockIndex === section.blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => commitArticle((current) => ({ ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, blocks: item.blocks.flatMap((itemBlock, itemBlockIndex) => itemBlockIndex === blockIndex ? [itemBlock, { ...itemBlock, id: createBlock(itemBlock.type).id }] : [itemBlock]) } : item) }))}><Copy className="h-4 w-4" /></Button>
                              <Button type="button" variant="outline" size="sm" className="rounded-full text-red-600" onClick={() => commitArticle((current) => ({ ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, blocks: item.blocks.filter((_, itemBlockIndex) => itemBlockIndex !== blockIndex).length > 0 ? item.blocks.filter((_, itemBlockIndex) => itemBlockIndex !== blockIndex) : [createBlock("paragraph")] } : item) }))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <BlockEditor block={block} onChange={(nextBlock) => commitArticle((current) => ({ ...current, sections: current.sections.map((item, index) => index === sectionIndex ? { ...item, blocks: item.blocks.map((itemBlock, itemBlockIndex) => itemBlockIndex === blockIndex ? nextBlock : itemBlock) } : item) }))} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      {BLOCK_LIBRARY.map((item) => {
                        const Icon = BLOCK_ICONS[item.type];
                        return <button key={item.type} type="button" onClick={() => addBlockToSection(sectionIndex, item.type)} className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-left text-sm font-bold text-zinc-700 transition hover:border-[color:var(--editor-accent-border)] hover:bg-[color:var(--editor-accent-soft)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"><Icon className="h-4 w-4 text-[color:var(--editor-accent-solid)]" />{item.label}</button>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSection} className="flex w-full items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-zinc-300 bg-white/70 px-6 py-5 text-sm font-black uppercase tracking-[0.22em] text-zinc-500 transition hover:border-[color:var(--editor-accent-border)] hover:bg-[color:var(--editor-accent-soft)] dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300"><Plus className="h-5 w-5" />Yeni bölüm ekle</button>
            </main>
            <aside className={cn(PANEL_CLASS, "overflow-hidden")}>
              <Tabs value={inspectorTab} onValueChange={(value) => setInspectorTab(value as InspectorTab)} className="h-full">
                <TabsList className="mx-5 mt-5 grid grid-cols-5 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
                  <TabsTrigger value="publish" className="rounded-xl"><Settings2 className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="relations" className="rounded-xl"><Link2 className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-xl"><CheckSquare className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="workspace" className="rounded-xl"><Sparkles className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-xl"><Eye className="h-4 w-4" /></TabsTrigger>
                </TabsList>
                <TabsContent value="publish" className="mt-0"><ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5"><div className="space-y-5"><div><FieldLabel>Slug</FieldLabel><Input value={article.slug} onChange={(event) => commitArticle((current) => ({ ...current, slug: slugify(event.target.value) }))} className={cn(FIELD_CLASS, "h-11 font-mono text-xs")} placeholder="ornek-icerik-url" /></div><div><FieldLabel>Bölüm</FieldLabel><Select value={article.sectionId} onValueChange={(value) => commitArticle((current) => ({ ...current, sectionId: value as SiteSectionId }))}><SelectTrigger className="h-12 w-full rounded-2xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"><SelectValue placeholder="Bölüm seçin" /></SelectTrigger><SelectContent>{SITE_SECTIONS.map((section) => <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => applySectionPreset(article.sectionId)}><Wand2 className="h-4 w-4" />Önerilen meta ayarı</Button></div><div><FieldLabel>Kategori</FieldLabel><Input value={article.category} onChange={(event) => commitArticle((current) => ({ ...current, category: event.target.value }))} className="h-11 rounded-2xl" placeholder="Kategori adı" /></div><div><FieldLabel>Rozet etiketi</FieldLabel><Input value={article.badgeLabel} onChange={(event) => commitArticle((current) => ({ ...current, badgeLabel: event.target.value }))} className="h-11 rounded-2xl" placeholder="Teknik rehber" /></div><div><FieldLabel>Renk sınıfı</FieldLabel><Input value={article.categoryColor} onChange={(event) => commitArticle((current) => ({ ...current, categoryColor: event.target.value }))} className={cn(FIELD_CLASS, "h-11 text-xs")} placeholder="bg-emerald-100 text-emerald-800 ..." /></div><div className="grid gap-4 md:grid-cols-2"><div><FieldLabel>Yazar</FieldLabel><Input value={article.author} onChange={(event) => commitArticle((current) => ({ ...current, author: event.target.value }))} className="h-11 rounded-2xl" /></div><div><FieldLabel>Ünvan</FieldLabel><Input value={article.authorTitle} onChange={(event) => commitArticle((current) => ({ ...current, authorTitle: event.target.value }))} className="h-11 rounded-2xl" /></div></div><div className="grid gap-4 md:grid-cols-2"><div><FieldLabel>Tarih</FieldLabel><Input value={article.date} onChange={(event) => commitArticle((current) => ({ ...current, date: event.target.value }))} className="h-11 rounded-2xl" /></div><div><FieldLabel>Okuma süresi</FieldLabel><Input value={article.readTime} onChange={(event) => commitArticle((current) => ({ ...current, readTime: event.target.value }))} className="h-11 rounded-2xl" disabled={workspace.autoReadTime} /></div></div><div><FieldLabel>Öne çıkan alıntı</FieldLabel><textarea value={article.quote.text} onChange={(event) => commitArticle((current) => ({ ...current, quote: { text: event.target.value } }))} className={cn(FIELD_CLASS, "min-h-[120px] resize-y italic")} placeholder="Makale içinde vurgulanacak alıntı" /></div></div></ScrollArea></TabsContent>
                <TabsContent value="relations" className="mt-0"><ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5"><div className="space-y-5"><div><FieldLabel>İlgili içerik ara</FieldLabel><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><Input value={relatedQuery} onChange={(event) => setRelatedQuery(event.target.value)} className="h-11 rounded-2xl pl-11" placeholder="Başlık veya slug" /></div></div><div className="space-y-2">{relatedCandidates.map((candidate) => { const checked = article.relatedSlugs.includes(candidate.slug); return <label key={candidate.slug} className={cn("flex cursor-pointer items-start gap-3 rounded-[24px] border px-4 py-4 transition", checked ? "border-[color:var(--editor-accent-border)] bg-[color:var(--editor-accent-soft)]" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950")}><input type="checkbox" checked={checked} onChange={(event) => commitArticle((current) => ({ ...current, relatedSlugs: event.target.checked ? [...current.relatedSlugs, candidate.slug] : current.relatedSlugs.filter((slug) => slug !== candidate.slug) }))} className="mt-1 h-4 w-4 rounded border-zinc-300" /><span className="min-w-0 flex-1"><span className="block text-sm font-black text-zinc-950 dark:text-zinc-50">{candidate.title}</span><span className="mt-1 block truncate text-xs leading-6 text-zinc-500 dark:text-zinc-400">/{candidate.slug} • {candidate.category}</span></span></label>; })}</div></div></ScrollArea></TabsContent>
                <TabsContent value="seo" className="mt-0"><ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5"><div className="space-y-3">{seoChecklist.map((item) => <div key={item.label} className={cn("flex items-center justify-between rounded-[24px] border px-4 py-4", item.status ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30")}><div><p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{item.label}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.detail}</p></div><span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", item.status ? "bg-emerald-600 text-white" : "bg-amber-500 text-white")}>{item.status ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}</span></div>)}</div></ScrollArea></TabsContent>
                <TabsContent value="workspace" className="mt-0"><ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5"><div className="space-y-5"><div><FieldLabel>Vurgu rengi</FieldLabel><div className="grid grid-cols-2 gap-2">{ACCENT_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => setWorkspace((current) => ({ ...current, accentId: option.id }))} className={cn("flex items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition", workspace.accentId === option.id ? "border-[color:var(--editor-accent-border)] bg-[color:var(--editor-accent-soft)]" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950")}><span className="h-5 w-5 rounded-full" style={{ backgroundColor: option.solid }} /><span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{option.label}</span></button>)}</div></div><div className="space-y-2"><button type="button" onClick={() => setWorkspace((current) => ({ ...current, autoSlug: !current.autoSlug }))} className={cn("flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition", workspace.autoSlug ? "border-[color:var(--editor-accent-border)] bg-[color:var(--editor-accent-soft)]" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950")}><span className="mt-0.5 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Auto</span><span><span className="block text-sm font-bold text-zinc-950 dark:text-zinc-50">Başlıktan slug üret</span><span className="mt-1 block text-xs leading-6 text-zinc-500 dark:text-zinc-400">Başlık değiştikçe URL alanı yenilenir.</span></span></button><button type="button" onClick={() => setWorkspace((current) => ({ ...current, autoReadTime: !current.autoReadTime }))} className={cn("flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition", workspace.autoReadTime ? "border-[color:var(--editor-accent-border)] bg-[color:var(--editor-accent-soft)]" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950")}><span className="mt-0.5 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Auto</span><span><span className="block text-sm font-bold text-zinc-950 dark:text-zinc-50">Okuma süresini hesapla</span><span className="mt-1 block text-xs leading-6 text-zinc-500 dark:text-zinc-400">Kelime sayısına göre süre belirlenir.</span></span></button></div><div className="rounded-[24px] border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950"><FieldLabel>İçe / dışa aktar</FieldLabel><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void copyJson()}><FileJson2 className="h-4 w-4" />JSON kopyala</Button><Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void copyMarkdown()}><Copy className="h-4 w-4" />Markdown kopyala</Button></div><textarea value={jsonBuffer} onChange={(event) => setJsonBuffer(event.target.value)} className={cn(FIELD_CLASS, "mt-4 min-h-[180px] resize-y font-mono text-xs")} placeholder="JSON içeriğini buraya yapıştırın" /><Button type="button" className="mt-3 rounded-full" onClick={() => { try { loadArticle(toEditorArticle(JSON.parse(jsonBuffer) as Partial<StoredArticle>), null); setHasUnsavedChanges(true); toast.success("JSON içeriği editöre yüklendi."); } catch { toast.error("JSON çözümlenemedi."); } }}>JSON içe aktar</Button></div></div></ScrollArea></TabsContent>
                <TabsContent value="preview" className="mt-0"><ScrollArea className="h-[calc(100vh-330px)] px-5 pb-5"><PreviewPane article={article} surface={workspace.previewSurface} /></ScrollArea></TabsContent>
              </Tabs>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
