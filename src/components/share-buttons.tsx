"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { SharePopup } from "@/components/share-popup";

interface ShareButtonsProps {
  title: string;
  slug: string;
  className?: string;
}

export function ShareButtons({ title, slug, className = "" }: ShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const url = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`),
    [slug],
  );

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={`rounded-lg bg-zinc-100 p-1.5 text-zinc-400 transition-all duration-200 hover:scale-110 hover:text-indigo-500 active:scale-95 dark:bg-zinc-800 dark:hover:text-indigo-400 ${className}`}
        aria-label="Paylaş"
        title="Paylaş"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <SharePopup open={open} onOpenChange={setOpen} title={title} url={url} />
    </>
  );
}
