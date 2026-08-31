"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import type { CadActiveMarkupStyle } from "@/lib/dokumantasyon/cad-review/store";
import {
  CadInlineReviewEditor,
  type CadInlineReviewEditorKind,
  type CadInlineReviewEditorRequest,
  type CadInlineReviewEditorResult,
} from "./cad-inline-review-editor";

const CAD_INLINE_EDITOR_REQUEST_EVENT = "cad:inline-review-editor-request";

type PendingResolver = (result: CadInlineReviewEditorResult | null) => void;
const pendingResolvers = new Map<string, PendingResolver>();

interface CadInlineEditorEventDetail {
  request: CadInlineReviewEditorRequest;
}

function nextRequestId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `cad-editor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function requestCadInlineReviewEditor(
  kind: CadInlineReviewEditorKind,
  clientPoint: { x: number; y: number }
): Promise<CadInlineReviewEditorResult | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const id = nextRequestId();
  const request: CadInlineReviewEditorRequest = { id, kind, screenPoint: clientPoint };

  return new Promise((resolve) => {
    pendingResolvers.set(id, resolve);
    window.dispatchEvent(
      new CustomEvent<CadInlineEditorEventDetail>(CAD_INLINE_EDITOR_REQUEST_EVENT, {
        detail: { request },
      })
    );
  });
}

function settleRequest(id: string, result: CadInlineReviewEditorResult | null) {
  const resolver = pendingResolvers.get(id);
  if (!resolver) return;
  pendingResolvers.delete(id);
  resolver(result);
}

export function CadInlineReviewEditorHost({
  style,
  onStyleChange,
}: {
  style: CadActiveMarkupStyle;
  onStyleChange: (patch: Partial<CadActiveMarkupStyle>) => void;
}) {
  const [request, setRequest] = React.useState<CadInlineReviewEditorRequest | null>(null);
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const syncViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  React.useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<CadInlineEditorEventDetail>).detail;
      if (!detail?.request) return;
      setRequest((current) => {
        if (current && current.id !== detail.request.id) settleRequest(current.id, null);
        return detail.request;
      });
    };
    window.addEventListener(CAD_INLINE_EDITOR_REQUEST_EVENT, onRequest);
    return () => {
      window.removeEventListener(CAD_INLINE_EDITOR_REQUEST_EVENT, onRequest);
      for (const [id, resolver] of pendingResolvers) {
        pendingResolvers.delete(id);
        resolver(null);
      }
    };
  }, []);

  if (!request || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[64]" data-cad-inline-editor-host="true">
      <CadInlineReviewEditor
        key={request.id}
        request={request}
        style={style}
        containerSize={viewport}
        onStyleChange={onStyleChange}
        onSubmit={(result) => {
          settleRequest(request.id, result);
          setRequest(null);
        }}
        onCancel={() => {
          settleRequest(request.id, null);
          setRequest(null);
        }}
      />
    </div>,
    document.body
  );
}
