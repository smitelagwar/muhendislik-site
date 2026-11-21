"use client";

import React from "react";
import styles from "../dok-workspace.module.css";

interface ExplorerSkeletonProps {
  viewMode: "list" | "grid";
  count?: number;
}

export function TopFetchingBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      data-testid="dok-top-fetching-bar"
      aria-hidden="true"
      className="relative h-0.5 w-full overflow-hidden bg-amber-500/15"
    >
      <div className={styles.topProgressBar} />
    </div>
  );
}

export function ExplorerSkeleton({ viewMode, count = 8 }: ExplorerSkeletonProps) {
  const items = Array.from({ length: count }, (_, idx) => idx);

  if (viewMode === "grid") {
    return (
      <div
        data-testid="dok-explorer-skeleton"
        aria-busy="true"
        aria-label="Dosyalar yükleniyor"
        className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {items.map((idx) => (
          <div
            key={idx}
            className="flex min-h-[16.25rem] flex-col rounded-2xl border border-border/50 bg-card/50 p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`h-4 w-4 rounded ${styles.skeletonShimmer}`} />
              <div className={`h-4 w-4 rounded-full ${styles.skeletonShimmer}`} />
            </div>
            <div className={`mx-auto my-4 h-20 w-20 rounded-2xl ${styles.skeletonShimmer}`} />
            <div className="mt-auto space-y-2">
              <div className={`h-3.5 w-4/5 rounded-md ${styles.skeletonShimmer}`} />
              <div className="flex items-center gap-2">
                <div className={`h-5 w-12 rounded-full ${styles.skeletonShimmer}`} />
                <div className={`h-5 w-14 rounded-full ${styles.skeletonShimmer}`} />
              </div>
              <div className="border-t border-border/40 pt-2">
                <div className={`h-2.5 w-24 rounded ${styles.skeletonShimmer}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="dok-explorer-skeleton"
      aria-busy="true"
      aria-label="Dosyalar yükleniyor"
      className="divide-y divide-border/40"
    >
      {items.map((idx) => (
        <div key={idx} className="flex h-14 items-center gap-3 px-4">
          <div className={`h-4 w-4 shrink-0 rounded ${styles.skeletonShimmer}`} />
          <div className={`h-8 w-8 shrink-0 rounded-xl ${styles.skeletonShimmer}`} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div
              className={`h-3.5 rounded-md ${styles.skeletonShimmer}`}
              style={{ width: `${52 + ((idx * 17) % 32)}%` }}
            />
            <div className={`h-2.5 w-24 rounded-md ${styles.skeletonShimmer}`} />
          </div>
          <div className={`hidden h-3 w-16 rounded sm:block ${styles.skeletonShimmer}`} />
          <div className={`hidden h-3 w-28 rounded md:block ${styles.skeletonShimmer}`} />
        </div>
      ))}
    </div>
  );
}
