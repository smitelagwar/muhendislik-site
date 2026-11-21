"use client";

import React from "react";
import { Keyboard } from "lucide-react";
import { OverlayPortal } from "./overlay-portal";

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Gezinme & Arama",
    items: [
      { keys: ["/", "Ctrl+Shift+F"], description: "Tüm klasörlerde derin arama aç" },
      { keys: ["Enter"], description: "Seçili klasörü veya dosyayı aç" },
      { keys: ["Space", "P"], description: "Seçili dosyayı önizle" },
      { keys: ["I"], description: "Detay ve etkinlik çekmecesini aç/kapat" },
      { keys: ["V"], description: "Liste ve Kart görünümü arasında geç" },
      { keys: ["R"], description: "Çalışma alanını yenile" },
      { keys: ["?"], description: "Klavye kısayolları penceresini aç" },
    ],
  },
  {
    title: "Dosya & Klasör İşlemleri",
    items: [
      { keys: ["Shift+N"], description: "Yeni klasör oluştur" },
      { keys: ["Ctrl+U"], description: "Dosya yükleme seçicisini aç" },
      { keys: ["F2"], description: "Seçili öğeyi yeniden adlandır" },
      { keys: ["M"], description: "Seçili öğeleri taşı" },
      { keys: ["Ctrl+D"], description: "Seçili dosyaları indir" },
      { keys: ["S"], description: "Yıldızla / Yıldızı kaldır" },
      { keys: ["Alt+S"], description: "Süreli paylaşım bağlantısı oluştur" },
      { keys: ["Delete"], description: "Seçili öğeleri çöp kutusuna at" },
    ],
  },
  {
    title: "Seçim, Pano & Çöp Kutusu",
    items: [
      { keys: ["Ctrl+A"], description: "Görünür tüm öğeleri seç" },
      { keys: ["Escape"], description: "Açık menüyü veya seçimi temizle" },
      { keys: ["Ctrl+C"], description: "Seçili öğeleri kopyala" },
      { keys: ["Ctrl+X"], description: "Seçili öğeleri kes" },
      { keys: ["Ctrl+V"], description: "Panodaki öğeleri yapıştır" },
      { keys: ["Alt+R"], description: "Çöp kutusunda seçili öğeyi geri yükle" },
      { keys: ["Shift+Delete"], description: "Çöp kutusunda kalıcı silme onayı aç" },
    ],
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <OverlayPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Klavye Kısayolları"
      presentation="dialog"
    >
      <div
        data-testid="dok-shortcuts-modal"
        className="w-full max-w-2xl bg-card p-5 text-card-foreground sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Klavye Kısayolları
            </h2>
            <p className="text-xs text-muted-foreground">
              Metin kutuları dışındayken tüm kısayollar anında çalışır.
            </p>
          </div>
        </div>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section
              key={group.title}
              className="rounded-xl border border-border/80 bg-secondary/35 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50 last:sm:col-span-2"
            >
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-foreground/90">{item.description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((keyLabel, idx) => (
                        <React.Fragment key={keyLabel}>
                          {idx > 0 && (
                            <span className="text-[10px] text-muted-foreground">/</span>
                          )}
                          <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
                            {keyLabel}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end border-t border-border/70 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </OverlayPortal>
  );
}
