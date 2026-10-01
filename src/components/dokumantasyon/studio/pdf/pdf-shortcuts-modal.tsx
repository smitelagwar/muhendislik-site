"use client";

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF KLAVYE KISAYOLLARI MODALI (FAZ F)
// ============================================================================

import React, { useRef, useEffect, useCallback } from "react";
import { Keyboard, X } from "lucide-react";

interface PdfShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    category: "Zoom ve Ölçek",
    items: [
      { keys: ["Ctrl", "+"], description: "Yakınlaştır" },
      { keys: ["Ctrl", "-"], description: "Uzaklaştır" },
      { keys: ["Ctrl", "0"], description: "Sayfaya Sığdır" },
      { keys: ["Ctrl", "1"], description: "Orijinal Boyut (%100)" },
      { keys: ["Ctrl", "2"], description: "Genişliğe Sığdır" },
      { keys: ["Ctrl", "Tekerlek"], description: "İmleç Odaklı Yakınlaştırma" },
    ],
  },
  {
    category: "Sayfa Gezinimi",
    items: [
      { keys: ["PageDown", "veya", "→"], description: "Sonraki Sayfa" },
      { keys: ["PageUp", "veya", "←"], description: "Önceki Sayfa" },
      { keys: ["Home"], description: "İlk Sayfaya Git" },
      { keys: ["End"], description: "Son Sayfaya Git" },
    ],
  },
  {
    category: "Araçlar ve Paneller",
    items: [
      { keys: ["Ctrl", "F"], description: "Dokümanda Ara" },
      { keys: ["H"], description: "El Aracı (Sayfayı Kaydır / Pan)" },
      { keys: ["V"], description: "Metin Seçim İmleci" },
      { keys: ["B"], description: "Küçük Resimler Kenar Çubuğu" },
      { keys: ["Ctrl", "R"], description: "90° Sağa Döndür" },
      { keys: ["Esc"], description: "Arama / Panelleri Kapat" },
      { keys: ["?"], description: "Klavye Kısayolları (Bu Menü)" },
    ],
  },
];

export function PdfShortcutsModal({ isOpen, onClose }: PdfShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      const trigger =
        document.querySelector<HTMLElement>('[data-testid="pdf-shortcuts-btn"]') ||
        document.querySelector<HTMLElement>('[data-testid="pdf-viewer-more-menu-trigger"]');
      trigger?.focus();
    }, 0);
  }, [onClose]);

  // Faz I: Odak Tuzağı (Focus Trap) ve Klavye Erişilebilirliği
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      data-testid="pdf-shortcuts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl text-zinc-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2 id="shortcuts-modal-title" className="text-base font-semibold text-zinc-100">
              Klavye Kısayolları
            </h2>
            <p className="text-xs text-zinc-400">
              PDF stüdyosunda hızlı kullanım için desteklenen klavye kısayolları
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {SHORTCUT_CATEGORIES.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">
                {cat.category}
              </h3>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {cat.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30 hover:bg-zinc-800/70 transition-colors"
                  >
                    <span className="text-zinc-300">{item.description}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {item.keys.map((k, kIdx) =>
                        k === "veya" ? (
                          <span key={kIdx} className="text-[10px] text-zinc-500 px-0.5">
                            veya
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="rounded-md bg-zinc-700/60 border border-zinc-600/50 px-2 py-0.5 text-[11px] font-semibold text-zinc-200 shadow-xs"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
