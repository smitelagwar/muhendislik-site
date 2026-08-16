"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileCheck,
  FileDown,
  FileEdit,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENTS,
  type DocumentCategory,
  type DocumentItem,
} from "@/lib/documents-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BetonDokumStudio } from "@/components/beton-dokum-studio";
import { TaahhutnameStudio } from "@/components/taahhutname-studio";
import { IstifaStudio } from "@/components/istifa-studio";

export function BelgelerHub() {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFormDoc, setActiveFormDoc] = useState<DocumentItem | null>(null);
  const [activePdfPreviewDoc, setActivePdfPreviewDoc] = useState<DocumentItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isCopied, setIsCopied] = useState(false);

  const searchInputId = useId();

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

    return DOCUMENTS.filter((doc) => {
      const matchesCategory =
        selectedCategory === "all" || doc.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!query) return true;

      const searchableText = [
        doc.title,
        doc.subtitle,
        doc.description,
        doc.categoryLabel,
        doc.targetAudience,
        doc.usageGuide,
        doc.legalReference || "",
        ...doc.tags,
        ...doc.fields.map((f) => f.label),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return searchableText.includes(query);
    });
  }, [selectedCategory, searchQuery]);

  const handleOpenForm = (doc: DocumentItem) => {
    setActiveFormDoc(doc);
    setFormValues({ ...doc.defaultValues });
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetForm = () => {
    if (activeFormDoc) {
      setFormValues({ ...activeFormDoc.defaultValues });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!activeFormDoc || !activeFormDoc.generatePreviewText) return;
    const text = activeFormDoc.generatePreviewText(formValues);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div>
      {/* Spotlight Feature: Beton Döküm Tutanağı Studio */}
      <div className="mb-8 relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 sm:p-6 shadow-md backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Canlı PDF Stüdyosu
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Resmi ÇŞB Şablonu</span>
              </div>
              <h3 className="mt-1 text-base sm:text-lg font-bold text-foreground">
                Beton Döküm Tutanağı Doldurucu & Düzenleyici
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                10 resmi AcroForm alanını tarayıcınızda doldurun, tam ekran canlı önizleyin ve anında resmi PDF formatında indirin.
              </p>
            </div>
          </div>

          <Link
            href="/belgeler/beton-dokum-tutanagi"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-amber-600/25 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shrink-0"
          >
            <span>Stüdyo Sayfasına Git</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="mb-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Belge veya şablon ara
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Belge adı, şantiye şefliği, tutanak, dilekçe veya anahtar kelime ara..."
              className="h-12 w-full rounded-xl border border-border bg-card/60 pl-11 pr-10 text-sm backdrop-blur-md transition-colors placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Count Badge */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-3 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Toplam {DOCUMENTS.length} Hazır Belge Şablonu</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === "all"
                ? DOCUMENTS.length
                : DOCUMENTS.filter((d) => d.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                  isSelected
                    ? "border border-amber-500/40 bg-amber-500/15 text-amber-900 shadow-sm dark:text-amber-200"
                    : "border border-border/80 bg-card/50 text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-bold">Aradığınız kriterlere uygun belge bulunamadı</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Farklı bir arama terimi deneyebilir veya filtreleri sıfırlayabilirsiniz.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Filtreleri Temizle
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              id={doc.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 dark:bg-card/40"
            >
              {/* Radial gradient glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-amber-400/10" />

              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <FileCheck className="h-3.5 w-3.5" />
                    {doc.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {doc.fileSize}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <Link
                  href={
                    doc.id === "beton-dokum-tutanagi"
                      ? "/belgeler/beton-dokum-tutanagi"
                      : doc.id === "santiye-sefi-taahhutnamesi"
                      ? "/belgeler/santiye-sefi-taahhutnamesi"
                      : "/belgeler/santiye-sefi-istifa-dilekcesi"
                  }
                  className="block group/link"
                >
                  <h3 className="mt-4 text-xl font-bold text-foreground transition-colors group-hover/link:text-amber-600 dark:group-hover/link:text-amber-400">
                    {doc.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs font-semibold text-amber-700/80 dark:text-amber-400/80">
                  {doc.subtitle}
                </p>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {doc.description}
                </p>

                {/* Legal reference badge */}
                {doc.legalReference && (
                  <div className="mt-4 rounded-lg bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Yasal Dayanak: </span>
                    {doc.legalReference}
                  </div>
                )}

                {/* Target Audience */}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{doc.targetAudience}</span>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2.5 pt-4 border-t border-border/60">
                <div className="grid grid-cols-2 gap-2">
                  {/* Direct PDF Download */}
                  <a
                    href={doc.downloadUrl}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md hover:shadow-amber-600/20 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                  >
                    <Download className="h-4 w-4" />
                    <span>PDF İndir</span>
                  </a>

                  {/* PDF Preview Modal */}
                  <button
                    type="button"
                    onClick={() => handleOpenForm(doc)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Önizle</span>
                  </button>
                </div>

                {/* Form Filler & Live Generator */}
                <Link
                  href={
                    doc.id === "beton-dokum-tutanagi"
                      ? "/belgeler/beton-dokum-tutanagi"
                      : doc.id === "santiye-sefi-taahhutnamesi"
                      ? "/belgeler/santiye-sefi-taahhutnamesi"
                      : "/belgeler/santiye-sefi-istifa-dilekcesi"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-xs font-bold text-amber-900 shadow-xs transition-all hover:border-amber-500/70 hover:bg-amber-500/25 dark:text-amber-200"
                >
                  <FileEdit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Canlı PDF Stüdyosunu Aç</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-amber-600 dark:text-amber-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Information & Guidance Notice */}
      <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/80 via-card/50 to-amber-500/5 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="space-y-3 flex-1">
            <h4 className="text-lg font-bold text-foreground">
              Resmi Belge & Tutanak Kullanım Rehberi
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bu bölümde yer alan tüm şablonlar; 3194 sayılı İmar Kanunu, Şantiye Şefleri Hakkında
              Yönetmelik ve Yapı Denetimi Uygulama Esaslarına uygun olarak hazırlanmış düzenlenebilir
              resmi formlardır. İndirdiğiniz PDF dosyalarını doğrudan Adobe Acrobat, web tarayıcısı veya
              portalımızdaki form doldurucu üzerinden düzenleyebilir, kaşe ve imzanızı tatbik ederek
              ilgili idareye sunabilirsiniz.
            </p>
            <div className="grid gap-3 pt-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/40 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Düzenlenebilir AcroForm Desteği</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary/40 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>2026 Mevzuatına Tam Uyum</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary/40 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Doğrudan Yazdırılabilir A4 Formatı</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Form Filler Modal */}
      {activeFormDoc && activeFormDoc.id === "beton-dokum-tutanagi" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl shadow-2xl">
            <BetonDokumStudio
              isModal={true}
              onClose={() => setActiveFormDoc(null)}
            />
          </div>
        </div>
      ) : activeFormDoc && activeFormDoc.id === "santiye-sefi-taahhutnamesi" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl shadow-2xl">
            <TaahhutnameStudio
              isModal={true}
              onClose={() => setActiveFormDoc(null)}
            />
          </div>
        </div>
      ) : activeFormDoc && activeFormDoc.id === "santiye-sefi-istifa-dilekcesi" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl shadow-2xl">
            <IstifaStudio
              isModal={true}
              onClose={() => setActiveFormDoc(null)}
            />
          </div>
        </div>
      ) : null}

      {/* PDF Direct Viewer Modal */}
      {activePdfPreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-foreground text-sm sm:text-base">
                    {activePdfPreviewDoc.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {activePdfPreviewDoc.badge} ({activePdfPreviewDoc.fileSize})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={activePdfPreviewDoc.downloadUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>İndir</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActivePdfPreviewDoc(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* PDF Embed / Iframe */}
            <div className="flex-1 bg-zinc-900 overflow-hidden">
              <iframe
                src={`${activePdfPreviewDoc.downloadUrl}#toolbar=1&navpanes=0`}
                title={activePdfPreviewDoc.title}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
