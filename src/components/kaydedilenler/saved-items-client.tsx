"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkX, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavedArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
}

export function SavedItemsClient({ articles }: { articles: Record<string, SavedArticle> }) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("bookmarks");
      setBookmarks(saved ? JSON.parse(saved) : []);
    };

    sync();
    window.addEventListener("bookmarks-updated", sync);
    return () => window.removeEventListener("bookmarks-updated", sync);
  }, []);

  const savedItems = useMemo(
    () => bookmarks.map((slug) => articles[slug]).filter(Boolean),
    [articles, bookmarks],
  );

  const removeBookmark = (slug: string) => {
    const updated = bookmarks.filter((item) => item !== slug);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
    window.dispatchEvent(new CustomEvent("bookmarks-updated"));
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Kişisel alan</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">Kaydedilen içerikler</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Yer imine eklediğiniz içerikler burada listelenir. Kaldırma işlemi doğrudan bu sayfadan yapılabilir.
        </p>
      </div>

      {savedItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-lg font-black text-zinc-900 dark:text-white">Henüz kayıtlı içerik yok.</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Makalelerdeki yer imi butonuyla içerik kaydedebilirsiniz.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/konu-haritasi">İçeriklere dön</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedItems.map((item) => (
            <div key={item.slug} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{item.category}</p>
              <h2 className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{item.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full">
                  <Link href={`/${item.slug}`}>
                    İçeriği aç <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={() => removeBookmark(item.slug)} className="rounded-full">
                  <BookmarkX className="mr-2 h-4 w-4" />
                  Kaydı kaldır
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
