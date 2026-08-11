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
    <div className="mt-10">
      {savedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/70 p-10 text-center">
          <p className="text-lg font-black text-zinc-900 dark:text-white">Henüz kayıtlı içerik yok.</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Makalelerdeki yer imi butonuyla içerik kaydedebilirsiniz.
          </p>
          <Button asChild className="mt-6">
            <Link href="/konu-haritasi">İçeriklere dön</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedItems.map((item) => (
            <div key={item.slug} className="site-panel rounded-xl p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{item.category}</p>
              <h2 className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{item.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href={`/${item.slug}`}>
                    İçeriği aç <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={() => removeBookmark(item.slug)}>
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
