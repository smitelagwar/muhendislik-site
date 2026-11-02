"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CadUpstreamAdapter,
  CadUpstreamAdapterError,
  CAD_BACKGROUND_COLORS,
  type CadBackgroundColorOption,
  type CadDistanceMeasurementSnapshot,
  type CadAreaMeasurementSnapshot,
  type CadChainDistanceSnapshot,
  type CadLayerItem,
  type CadLoadingPhase,
  type CadUpstreamDisplayMode,
  type CadUpstreamTheme,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import {
  CAD_SNAP_MODES,
  getEnabledCadSnapModes,
  loadCadSnapSettings,
  saveCadSnapSettings,
  type CadSnapSettings,
  type CadSnapSettingsStorage,
} from "@/lib/dokumantasyon/cad-upstream/snap-settings";
import { resolveCadUpstreamTimeoutMs } from "@/lib/dokumantasyon/dwg/runtime-policy";
import {
  CadDistanceOverlay,
  type CadDistanceOverlayMeasurement,
} from "./cad-distance-overlay";
import {
  CadAreaOverlay,
  type CompletedAreaMeasurement,
} from "./cad-area-overlay";
import { CadStudioRibbon } from "./cad-studio-ribbon";
import { CadReviewInputDialog, type CadReviewInputKind } from "./cad-review-input-dialog";
import { CadTechnologyLoader } from "./cad-technology-loader";

// ── CAD Review V1 ──────────────────────────────────────────────┶��q�^