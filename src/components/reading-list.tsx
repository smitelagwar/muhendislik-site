"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Trash2, X } from "lucide-react";

interface ReadingListItem {
  slug: string;
  title: string;
  category: string;
}

interface ReadingListProps {
  allItems: ReadingListItem[];
}

export function ReadingList({ allItems }: ReadingListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const syncBookmarks = () => {
      const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]") as string[];
      setBookmarks(saved);
    };

    syncBookmarks();
    window.addEventListener("bookmarks-updated", syncBookmarks);
    return () => window.removeEventListener("bookmarks-updated", syncBookmarks);
  }, []);

  const removeBookmark = (slug: string) => {
    const updated = bookmarks.filter((item) => item !== slug);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
    window.dispatchEvent(new CustomEvent("bookmarks-updated"));
  };

  const savedItems = allItems.filter((item) => bookmarks.includes(item.slug));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/30 transition-all duration-300 hover:scale-110 hover:bg-teal-600 active:scale-95"
        aria-label="Okuma listesi"
        title="Okuma listesi"
      >
        <BookOpen className="h-5 w-5" />
        {bookmarks.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {bookmarks.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Okuma listesini kapat"
          />
          <div className="fixed right-0 top-0 z-[151] flex h-full w-80 flex-col bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <BookOpen className="h-5 w-5 text-teal-500" />
                Okuma Listem
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {savedItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
                  <BookOpen className="h-12 w-12 opacity-30" />
                  <p className="text-center text-sm">
                    Henüz yer imi eklenmedi.
                    <br />
                    Makalelerdeki yer imi butonunu kullanın.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedItems.map((item) => (
                    <div key={item.slug} className="group flex items-start gap-2">
                      <Link
                        href={`/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-lg p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <p className="text-sm font-medium text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                          {item.title}
                        </p>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.category}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeBookmark(item.slug)}
                        className="mt-2 p-2 text-zinc-300 transition-colors hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                        aria-label="Yer imini kaldır"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
