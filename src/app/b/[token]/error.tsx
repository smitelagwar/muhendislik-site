"use client";

import { ShareAccessState } from "@/components/belge-paylasim/share-access-state";

export default function ShareError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ShareAccessState state="error" onRetry={reset} />;
}
