// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — BODY-LEVEL OVERLAY PORTAL & DIALOG HOST
// ============================================================================

"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

export interface OverlayPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  zIndex?: number | string;
  preventBackdropClose?: boolean;
}

export function OverlayPortal({
  children,
  isOpen,
  onClose,
  zIndex = "var(--dok-z-dialog-backdrop, 600)",
  preventBackdropClose = false,
}: OverlayPortalProps) {
  const [mounted, setMounted] = useState(false);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    // Body scroll lock
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
      }

      // Focus trap
      if (e.key === "Tab" && modalContainerRef.current) {
        const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Initial focus into modal
    const timer = window.setTimeout(() => {
      if (modalContainerRef.current) {
        const initialFocus = modalContainerRef.current.querySelector<HTMLElement>(
          "[autofocus], input, button"
        );
        initialFocus?.focus();
      }
    }, 20);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      // Restore focus to trigger
      triggerElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const targetHost =
    document.getElementById("dok-overlay-root") || document.body;

  const content = (
    <div
      ref={modalContainerRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "grid",
        placeItems: "center",
        padding: "16px",
      }}
      className="bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (!preventBackdropClose && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        style={{
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
        }}
        className="w-full flex justify-center"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, targetHost);
}
