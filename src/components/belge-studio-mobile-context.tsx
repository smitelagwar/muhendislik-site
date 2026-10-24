"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface BelgePreviewBridge {
  pdfUrl: string | null;
  pdfReady: boolean;
  inlineEdit: {
    active: boolean;
    setActive: (next: boolean) => void;
  };
}

export interface BelgeStudioMobileContextValue {
  drawerOpen: boolean;
  openDrawer: (triggerEl?: HTMLElement | null) => void;
  closeDrawer: () => void;
  triggerElement: HTMLElement | null;
  preview: BelgePreviewBridge;
  registerPreviewBridge: (bridge: BelgePreviewBridge) => void;
  extraActions: ReactNode;
  setExtraActions: (actions: ReactNode) => void;
}

const DEFAULT_PREVIEW_BRIDGE: BelgePreviewBridge = {
  pdfUrl: null,
  pdfReady: false,
  inlineEdit: {
    active: false,
    setActive: () => {},
  },
};

const DEFAULT_CONTEXT_VALUE: BelgeStudioMobileContextValue = {
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  triggerElement: null,
  preview: DEFAULT_PREVIEW_BRIDGE,
  registerPreviewBridge: () => {},
  extraActions: null,
  setExtraActions: () => {},
};

const BelgeStudioMobileContext = createContext<BelgeStudioMobileContextValue>(DEFAULT_CONTEXT_VALUE);

export interface BelgeStudioMobileProviderProps {
  children: ReactNode;
  initialExtraActions?: ReactNode;
}

export function BelgeStudioMobileProvider({
  children,
  initialExtraActions = null,
}: BelgeStudioMobileProviderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [previewBridge, setPreviewBridge] = useState<BelgePreviewBridge>(DEFAULT_PREVIEW_BRIDGE);
  const [extraActions, setExtraActions] = useState<ReactNode>(initialExtraActions);

  const openDrawer = useCallback((triggerEl?: HTMLElement | null) => {
    if (triggerEl) {
      setTriggerElement(triggerEl);
    }
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const registerPreviewBridge = useCallback((bridge: BelgePreviewBridge) => {
    setPreviewBridge(bridge);
  }, []);

  // Masaüstü ekran boyutuna (>= 1024px) geçildiğinde açık çekmece otomatik kapatılır.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setDrawerOpen(false);
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const value = useMemo<BelgeStudioMobileContextValue>(
    () => ({
      drawerOpen,
      openDrawer,
      closeDrawer,
      triggerElement,
      preview: previewBridge,
      registerPreviewBridge,
      extraActions,
      setExtraActions,
    }),
    [drawerOpen, openDrawer, closeDrawer, triggerElement, previewBridge, registerPreviewBridge, extraActions]
  );

  return (
    <BelgeStudioMobileContext.Provider value={value}>
      {children}
    </BelgeStudioMobileContext.Provider>
  );
}

/**
 * Belge Stüdyosu mobil çekmece ve preview durumu kancası.
 * Provider dışında çağrıldığında güvenli varsayılanlar döner, hata fırlatmaz.
 */
export function useBelgeStudioMobileContext(): BelgeStudioMobileContextValue {
  return useContext(BelgeStudioMobileContext);
}
