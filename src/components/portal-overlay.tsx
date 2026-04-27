"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  lockScroll?: boolean;
}

export function PortalOverlay({
  isOpen,
  onClose,
  children,
  lockScroll = true,
}: PortalOverlayProps) {
  useEffect(() => {
    if (lockScroll && isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, lockScroll]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === "undefined" || !isOpen) return null;

  return createPortal(children, document.body);
}
