"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BelgePdfResult, PdfFieldLayouts } from "@/lib/belgeler-pdf-layout";
import { prewarmBrowserPdfJs } from "@/lib/pdfjs-client";

export type BelgeGenerationStatus = "generating" | "ready" | "error";

export interface BelgeDocumentSnapshot {
  bytes: Uint8Array;
  blobUrl: string;
  revision: number;
  layouts: PdfFieldLayouts;
}

interface BelgeDocumentState<T> {
  status: BelgeGenerationStatus;
  error: string | null;
  snapshot: BelgeDocumentSnapshot | null;
  sourceData: T | null;
}

const GENERATION_DEBOUNCE_MS = 250;
const GENERATION_TIMEOUT_MS = 45_000;

/** Keeps the newest generated PDF bytes and owns their temporary object URL. */
export function useBelgeStudioDocument<T>(
  data: T,
  generate: (data: T) => Promise<Uint8Array | BelgePdfResult>
) {
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<BelgeDocumentState<T>>({
    status: "generating",
    error: null,
    snapshot: null,
    sourceData: null,
  });
  const requestRef = useRef(0);
  const activeUrlRef = useRef<string | null>(null);
  const hasGeneratedRef = useRef(false);
  const lastRetryVersionRef = useRef(0);

  useEffect(() => {
    prewarmBrowserPdfJs();
  }, []);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: "generating", error: null, sourceData: data }));
    setRetryVersion((version) => version + 1);
  }, [data]);

  useEffect(() => {
    const requestId = ++requestRef.current;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let generationTimeout: ReturnType<typeof setTimeout> | null = null;
    const isInitialOrRetry = !hasGeneratedRef.current || lastRetryVersionRef.current !== retryVersion;
    lastRetryVersionRef.current = retryVersion;
    const delayMs = isInitialOrRetry ? 0 : GENERATION_DEBOUNCE_MS;

    timer = setTimeout(() => {
      hasGeneratedRef.current = true;
      setState((current) => ({ ...current, status: "generating", error: null, sourceData: data }));
      const timeout = new Promise<never>((_, reject) => {
        generationTimeout = setTimeout(
          () => reject(new Error("PDF oluşturma zaman aşımına uğradı.")),
          GENERATION_TIMEOUT_MS
        );
      });

      void Promise.race([Promise.resolve().then(() => generate(data)), timeout])
        .then((result) => {
          if (requestRef.current !== requestId) return;
          const sourceBytes = result instanceof Uint8Array ? result : result.bytes;
          const layouts = result instanceof Uint8Array ? {} : result.layouts;
          if (!sourceBytes || sourceBytes.byteLength < 5) {
            throw new Error("Oluşturulan PDF verisi boş veya geçersiz.");
          }
          const bytes = sourceBytes.slice();
          const header = new TextDecoder().decode(bytes.subarray(0, 5));
          if (header !== "%PDF-") {
            throw new Error("Oluşturulan dosya PDF biçiminde değil.");
          }

          const blobUrl = URL.createObjectURL(
            new Blob([bytes], { type: "application/pdf" })
          );
          const previousUrl = activeUrlRef.current;
          activeUrlRef.current = blobUrl;
          setState({
            status: "ready",
            error: null,
            snapshot: { bytes, blobUrl, revision: requestId, layouts },
            sourceData: data,
          });
          if (previousUrl) URL.revokeObjectURL(previousUrl);
        })
        .catch((error: unknown) => {
          if (requestRef.current !== requestId) return;
          setState((current) => ({
            ...current,
            status: "error",
            sourceData: data,
            error:
              error instanceof Error
                ? error.message
                : "PDF oluşturulamadı. Tekrar deneyin.",
          }));
        })
        .finally(() => {
          if (generationTimeout) {
            clearTimeout(generationTimeout);
            generationTimeout = null;
          }
        });
    }, delayMs);

    return () => {
      requestRef.current += 1;
      if (timer) clearTimeout(timer);
      if (generationTimeout) clearTimeout(generationTimeout);
    };
  }, [data, generate, retryVersion]);

  useEffect(
    () => () => {
      requestRef.current += 1;
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    },
    []
  );

  const status = state.sourceData === data ? state.status : "generating";
  return { status, error: state.error, snapshot: state.snapshot, retry };
}
