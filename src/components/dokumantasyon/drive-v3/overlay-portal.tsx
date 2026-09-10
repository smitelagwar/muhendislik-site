"use client";
import React, { useRef } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useVisibleViewport } from "./use-visible-viewport";
import styles from "../mobile-workspace.module.css";
export interface OverlayPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  zIndex?: number | string;
  preventBackdropClose?: boolean;
  title?: string;
  presentation?: "dialog" | "sheet" | "drawer";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}
/** Odak ve scroll kilidinin tek sahibi. */
export function OverlayPortal({ children, isOpen, onClose, zIndex = "var(--dok-z-dialog-backdrop, 600)", preventBackdropClose = false, title = "Dokümantasyon işlemi", presentation = "dialog", initialFocusRef, returnFocusRef }: OverlayPortalProps) {
  const trigger = useRef<HTMLElement | null>(null);
  const rect = useVisibleViewport(isOpen);
  return <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose?.(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.backdrop} style={{ zIndex }} />
      <Dialog.Content className={styles.modal} data-presentation={presentation} aria-describedby={undefined}
        style={{ zIndex, ...(rect ? { maxHeight: rect.height - 16, top: presentation === "sheet" ? rect.top + rect.height : rect.top + rect.height / 2 } : {}) }}
        onOpenAutoFocus={event => {
          trigger.current = document.activeElement as HTMLElement | null;
          if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus(); }
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          const target = returnFocusRef?.current || trigger.current;
          if (target?.isConnected) target.focus({ preventScroll: true });
          else document.querySelector<HTMLElement>('[data-testid="dok-phone-more"], [data-testid="dok-explorer-viewport"]')?.focus({ preventScroll: true });
        }}
        onPointerDownOutside={event => { if (preventBackdropClose) event.preventDefault(); }}>
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        {children}
        <Dialog.Close aria-label="Pencereyi kapat" className={styles.modalClose}><X size={20} aria-hidden /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
