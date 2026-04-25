import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isVercelProduction } from "@/lib/site-config";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (isVercelProduction()) {
    notFound();
  }

  return children;
}
