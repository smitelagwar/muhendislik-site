"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Eye,
  FilePenLine,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_AUTH_STORAGE_KEY,
  ADMIN_PASSWORD,
  EDITOR_DRAFT_STORAGE_KEY,
  LAST_EDITED_ARTICLE_KEY,
  SECTION_PRESETS,
  parseReadTime,
  toEditorArticle,
  toStoredArticle,
  type StoredArticle,
} from "@/lib/admin-editor";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { cn } from "@/lib/utils";

const PANEL_CLASS =
  "rounded-[28px] border border-white/70 bg-white/92 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/88";

interface DraftSummary {
  title: string;
  slug: string;
  savedAt: string;
}

function readDraftSummary() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { article?: Partial<StoredArticle>; savedAt?: string };
    if (!parsed.article) {
      return null;
    }

    const article = toStoredArticle(toEditorArticle(parsed.article));

    return {
      title: article.title || "Başlıksız taslak",
      slug: article.slug || "yeni-icerik",
      savedAt: parsed.savedAt || "",
    } satisfies DraftSummary;
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);
  const [lastEditedSlug, setLastEditedSlug] = useState("");

  const deferredSearch = useDeferredValue(search);

  const filteredArticles = useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase("tr-TR");

    return articles.filter((article) => {
      const matchesSection = sectionFilter === "all" || article.sectionId === sectionFilter;
      const matchesQuery = !query || `${article.title} ${article.slug} ${article.category}`.toLocaleLowerCase("tr-TR").includes(query);
      return matchesSection && matchesQuery;
    });
  }, [articles, deferredSearch, sectionFilter]);

  const metrics = useMemo(() => {
    const totalReadTime = articles.reduce((sum, article) => sum + parseReadTime(article.readTime), 0);
    const sectionsCount = new Set(articles.map((article) => article.sectionId)).size;
    return {
      total: articles.length,
      sections: sectionsCount,
      avgReadTime: articles.length > 0 ? Math.round(totalReadTime / articles.length) : 0,
      latest: lastEditedSlug || "-",
    };
  }, [articles, lastEditedSlug]);

  async function fetchArticles() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/articles");
      if (!response.ok) {
        throw new Error("İçerikler alınamadı.");
      }

      const data = (await response.json()) as Record<string, Partial<StoredArticle>>;
      const list = Object.values(data).map((item) => toStoredArticle(toEditorArticle(item)));
      setArticles(list);
    } catch (error) {
      console.error(error);
      toast.error("Makale listesi yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const storedAuth = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    setDraftSummary(readDraftSummary());
    setLastEditedSlug(localStorage.getItem(LAST_EDITED_ARTICLE_KEY) || "");

    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsLoading(false);
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchArticles();
    }
  }, [isAuthenticated]);

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      toast.success("Yönetim paneli açıldı.");
      return;
    }
    toast.error("Şifre hatalı.");
  }

  function handleLogout() {
    setIsAuthenticated(false);
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setPassword("");
  }

  async function handleDelete(slug: string) {
    if (!window.confirm("Bu içeriği silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/articles?slug=${slug}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Silme başarısız.");
      }
      toast.success("İçerik silindi.");
      await fetchArticles();
    } catch (error) {
      console.error(error);
      toast.error("İçerik silinemedi.");
    }
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(29,78,216,0.12)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
                <Shield className="h-4 w-4" />
                Admin dashboard
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">Modern yönetim paneli</h1>
                <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">Editör çalışma alanına ve içerik yönetimine erişmek için şifreyi girin.</p>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <LayoutDashboard className="h-6 w-6" />
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-2xl" placeholder="Şifre" />
            <Button type="submit" className="h-12 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">Panele gir</Button>
          </form>
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 px-4 py-4 text-xs leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">Yönetici şifresi: <span className="font-black text-zinc-950 dark:text-zinc-100">admin123</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.14),transparent_24%),linear-gradient(180deg,#edf4ff_0%,#f5f7fb_50%,#fcfcfd_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_24%),linear-gradient(180deg,#050b15_0%,#08111e_50%,#09111e_100%)]">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6">
        <div className={cn(PANEL_CLASS, "overflow-hidden p-6 md:p-8")}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border-none bg-blue-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Content ops</Badge>
                <Badge variant="outline" className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">{metrics.total} içerik</Badge>
                <Badge variant="outline" className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">{metrics.sections} ana bölüm</Badge>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-4xl">Yönetim dashboard’u</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">Hızlı aksiyonlar, taslak devamı, filtrelenebilir içerik listesi ve yeni editöre giriş burada toplanıyor.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href="/"><Eye className="h-4 w-4" />Siteyi aç</Link></Button>
              <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href="/admin/editor"><FilePenLine className="h-4 w-4" />Editöre geç</Link></Button>
              <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={handleLogout}><X className="h-4 w-4" />Çıkış</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={cn(PANEL_CLASS, "px-5 py-5")}><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Toplam içerik</p><p className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{metrics.total}</p></div>
          <div className={cn(PANEL_CLASS, "px-5 py-5")}><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Ortalama okuma</p><p className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{metrics.avgReadTime} dk</p></div>
          <div className={cn(PANEL_CLASS, "px-5 py-5")}><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Son düzenlenen</p><p className="mt-2 truncate text-base font-black text-zinc-950 dark:text-zinc-50">{metrics.latest}</p></div>
          <div className={cn(PANEL_CLASS, "px-5 py-5")}><p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Taslak durumu</p><p className="mt-2 text-base font-black text-zinc-950 dark:text-zinc-50">{draftSummary ? "Hazır" : "Yok"}</p></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className={cn(PANEL_CLASS, "p-5")}>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Hızlı aksiyonlar</p>
            <div className="mt-4 grid gap-3">
              <Button asChild className="h-12 justify-between rounded-2xl"><Link href="/admin/editor"><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" />Boş içerik başlat</span><ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="h-12 justify-between rounded-2xl"><Link href="/admin/editor?template=field-guide"><span className="inline-flex items-center gap-2"><Wand2 className="h-4 w-4" />Şablonla başlat</span><ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="h-12 justify-between rounded-2xl" disabled={!draftSummary}><Link href="/admin/editor?draft=1"><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />Taslağa devam et</span><ArrowRight className="h-4 w-4" /></Link></Button>
            </div>

            {draftSummary ? (
              <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{draftSummary.title}</p>
                <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">/{draftSummary.slug}</p>
                <p className="mt-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{draftSummary.savedAt ? new Date(draftSummary.savedAt).toLocaleString("tr-TR") : "Yakın zamanda"} kaydedildi.</p>
              </div>
            ) : null}

            <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Bölüm presetleri</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SECTION_PRESETS.map((preset) => (
                  <Badge key={preset.sectionId} variant="outline" className="rounded-full px-3 py-2 text-[11px] font-bold">{SITE_SECTIONS.find((section) => section.id === preset.sectionId)?.title || preset.sectionId}</Badge>
                ))}
              </div>
            </div>
          </aside>

          <section className={cn(PANEL_CLASS, "p-5")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-2xl pl-11" placeholder="Başlık, slug veya kategori ara" />
                </div>
                <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                  <option value="all">Tüm bölümler</option>
                  {SITE_SECTIONS.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                </select>
              </div>
              <Badge variant="outline" className="rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">{filteredArticles.length} sonuç</Badge>
            </div>

            {isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredArticles.map((article) => (
                  <article key={article.slug} className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="relative h-44 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {article.image ? <Image src={article.image} alt={article.title} fill className="object-cover" unoptimized /> : null}
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("border-none text-[10px] font-black uppercase tracking-[0.18em]", article.categoryColor)}>{article.category}</Badge>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.18em]">{SITE_SECTIONS.find((section) => section.id === article.sectionId)?.title || article.sectionId}</Badge>
                      </div>
                      <div>
                        <h2 className="line-clamp-2 text-lg font-black leading-snug text-zinc-950 dark:text-zinc-50">{article.title}</h2>
                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">{article.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        <span>{article.readTime}</span>
                        <span>{article.sections.length} bölüm</span>
                        <span>/{article.slug}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="rounded-2xl"><Link href={`/admin/editor?edit=${article.slug}`}><FilePenLine className="h-4 w-4" />Düzenle</Link></Button>
                        <Button asChild variant="outline" className="rounded-2xl"><Link href={`/admin/editor?duplicate=${article.slug}`}><Copy className="h-4 w-4" />Kopyala</Link></Button>
                        <Button asChild variant="outline" className="rounded-2xl"><Link href={`/${article.slug}`}><Eye className="h-4 w-4" />Aç</Link></Button>
                        <Button type="button" variant="outline" className="rounded-2xl text-red-600" onClick={() => void handleDelete(article.slug)}><Trash2 className="h-4 w-4" />Sil</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
