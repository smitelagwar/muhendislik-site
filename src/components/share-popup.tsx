"use client";

import { useEffect, useMemo } from "react";
import { Copy, Link2, Linkedin, Mail, MessageCircle, Send, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";

interface SharePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  url?: string;
}

interface ShareOption {
  label: string;
  icon: typeof Link2;
  href: string;
}

function buildShareOptions(title: string, url: string): ShareOption[] {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "E-posta",
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];
}

export function SharePopup({ open, onOpenChange, title, url }: SharePopupProps) {
  const { showToast } = useToast();
  const pageTitle = title || (typeof document !== "undefined" ? document.title : "Icerigi paylas");
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareOptions = useMemo(() => buildShareOptions(pageTitle, pageUrl), [pageTitle, pageUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const copyLink = async () => {
    if (!pageUrl) {
      return;
    }

    await navigator.clipboard.writeText(pageUrl);
    showToast("Paylasim baglantisi kopyalandi.", "share");
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[220] bg-black/55 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="fixed inset-0 z-[221] flex items-end justify-center px-4 pt-10 md:items-center md:pb-4">
        <div className="w-full max-w-lg rounded-t-[2rem] border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 md:rounded-[2rem] md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Paylas</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Icerigi paylas</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Bu pencere gorsel bir paylasim akis sunar. En hizli secenek baglantiyi kopyalamaktir.
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full bg-zinc-100 dark:bg-zinc-900">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{pageTitle}</p>
            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{pageUrl}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;

              return (
                <a
                  key={option.label}
                  href={option.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-bold text-zinc-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-800 dark:hover:text-blue-300"
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </a>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={copyLink} className="h-12 flex-1 rounded-full bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
              <Copy className="mr-2 h-4 w-4" />
              Baglantiyi kopyala
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 rounded-full border-zinc-300 px-6 text-sm font-black dark:border-zinc-700">
              <Send className="mr-2 h-4 w-4" />
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
