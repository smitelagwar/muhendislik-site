"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface BookmarkButtonProps {
  slug: string;
  title?: string;
  className?: string;
}

export function BookmarkButton({ slug, title, className = "" }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("bookmarks");
    if (!saved) {
      return;
    }

    const bookmarks: string[] = JSON.parse(saved);
    queueMicrotask(() => setIsBookmarked(bookmarks.includes(slug)));
  }, [slug]);

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const bookmarks: string[] = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const resolvedTitle =
      title || (typeof document !== "undefined" ? document.title.replace(" | İnşa Blog", "") : "İçerik");

    let updated: string[];
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter((item) => item !== slug);
      showToast("Yer iminden kaldırıldı.", "bookmark");
    } else {
      updated = [...bookmarks, slug];
      showToast(`"${resolvedTitle}" yer imlerine eklendi.`, "bookmark");
    }

    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setIsBookmarked(updated.includes(slug));
    window.dispatchEvent(new CustomEvent("bookmarks-updated"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg p-1.5 transition-all duration-200 hover:scale-110 active:scale-95 ${
        isBookmarked
          ? "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400"
          : "bg-zinc-100 text-muted-foreground hover:text-teal-500 dark:bg-border dark:hover:text-teal-400"
      } ${className}`}
      aria-label={isBookmarked ? "Yer iminden kaldır" : "Yer imine ekle"}
      title={isBookmarked ? "Yer iminden kaldır" : "Yer imine ekle"}
    >
      {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
    </button>
  );
}
