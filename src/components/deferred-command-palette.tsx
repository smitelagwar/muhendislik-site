"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

interface CommandPaletteProps {
  openSignal?: number;
  toggleSignal?: number;
}

type CommandPaletteComponent = ComponentType<CommandPaletteProps>;

export function DeferredCommandPalette() {
  const [CommandPalette, setCommandPalette] = useState<CommandPaletteComponent | null>(null);
  const [openSignal, setOpenSignal] = useState(0);
  const [toggleSignal, setToggleSignal] = useState(0);
  const loadingRef = useRef(false);

  const loadCommandPalette = useCallback(() => {
    if (CommandPalette || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    void import("@/components/command-palette")
      .then((module) => {
        setCommandPalette(() => module.CommandPalette);
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, [CommandPalette]);

  const openPalette = useCallback(() => {
    loadCommandPalette();
    setOpenSignal((current) => current + 1);
  }, [loadCommandPalette]);

  const togglePalette = useCallback(() => {
    loadCommandPalette();
    setToggleSignal((current) => current + 1);
  }, [loadCommandPalette]);

  useEffect(() => {
    const handleOpenEvent = () => openPalette();
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
      }
    };

    window.addEventListener("open-command-palette", handleOpenEvent);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-command-palette", handleOpenEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPalette, togglePalette]);

  return CommandPalette ? <CommandPalette openSignal={openSignal} toggleSignal={toggleSignal} /> : null;
}
