"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { UploadQueueManager, type UploadQueueItem } from "./upload-queue";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { DokQueryProvider, dokQueryClient, dokKeys } from "./query-client";
import type { UploadQueueItem as UIQueueItem } from "../upload-progress-toast";
const Context = createContext<{
  manager: UploadQueueManager;
  queue: UIQueueItem[];
} | null>(null);
const waitForUploadMetadata = async (pathname: string) => {
  const retryDelays = [250, 500, 750, 1_000, 1_500, 2_000];

  for (const delay of retryDelays) {
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    const result = await requestDokMutation<{ finalized?: boolean }>(
      `/api/dokumantasyon/upload/status?pathname=${encodeURIComponent(pathname)}`,
    );

    if (result.ok && result.data.finalized) return;
    if (
      !result.ok &&
      (result.code === "HTTP_401" || result.code === "HTTP_403")
    ) {
      throw new Error(result.message);
    }
  }

  throw new Error(
    "Dosya depoya yüklendi ancak liste kaydı doğrulanamadı. Lütfen listeyi yenileyin.",
  );
};

const runQueueItem = async (
  item: UploadQueueItem,
  onProgress: (value: number) => void,
) => {
  if (!item.file) return;
  const file = item.file;
  const targetFolderId = item.targetFolderId || null;

  onProgress(5);
  try {
    const intentResult = await requestDokMutation<{
      isLocalMode?: boolean;
      pathname: string;
      handleUploadUrl?: string;
      intentToken: string;
      mimeType?: string;
    }>("/api/dokumantasyon/upload/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        folderId: targetFolderId,
      }),
    });
    if (!intentResult.ok) throw new Error(intentResult.message);
    const tokenData = intentResult.data;

    if (tokenData.isLocalMode) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pathname", tokenData.pathname);
      formData.append("folderId", targetFolderId || "null");
      onProgress(60);
      const localResult = await requestDokMutation(
        "/api/dokumantasyon/upload/local",
        { method: "POST", body: formData },
      );
      if (!localResult.ok) throw new Error(localResult.message);
    } else {
      if (!tokenData.handleUploadUrl)
        throw new Error("Yükleme kontrol uç noktası bulunamadı.");
      onProgress(10);
      await (
        await import("@vercel/blob/client")
      ).uploadPresigned(tokenData.pathname, file, {
        access: "private",
        handleUploadUrl: tokenData.handleUploadUrl,
        clientPayload: JSON.stringify({ intentToken: tokenData.intentToken }),
        contentType: tokenData.mimeType,
        multipart: file.size >= 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          onProgress(
            Math.min(90, Math.max(10, Math.round(percentage * 0.8 + 10))),
          );
        },
      });
      onProgress(92);
    }

    onProgress(96);
    await waitForUploadMetadata(tokenData.pathname);
    void dokQueryClient.invalidateQueries({ queryKey: dokKeys.all });
  } catch (error: unknown) {
    console.error("Yükleme hatası:", error);
    const errorMessage = error instanceof Error ? error.message : "Yüklenemedi";
    throw new Error(errorMessage);
  }
};

export function DokWorkspaceSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [manager] = useState(() => {
    const m = new UploadQueueManager(3);
    m.setExecutor(runQueueItem);
    return m;
  });
  const [queue, setQueue] = useState<UIQueueItem[]>([]);
  useEffect(
    () =>
      manager.subscribe((items) =>
        setQueue(
          items.map((item) => ({
            ...item,
            status:
              item.status === "success"
                ? "completed"
                : item.status === "failed" || item.status === "cancelled"
                  ? "error"
                  : item.status,
          })),
        ),
      ),
    [manager],
  );
  return (
    <DokQueryProvider>
      <Context.Provider value={{ manager, queue }}>{children}</Context.Provider>
    </DokQueryProvider>
  );
}
export function useDokUploadSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Dokümantasyon oturum sağlayıcısı bulunamadı.");
  return value;
}
