import type { Metadata } from "next";
import { IrregularityStudioShell } from "@/components/duzensizlik-simulatoru/irregularity-studio-shell";

export const metadata: Metadata = {
  title: "3B Bina Düzensizliği Simülatörü | TBDY 2018",
  description: "TBDY 2018 A1–A3 ve B1–B3 düzensizliklerini eğitsel 3B senaryolarla keşfedin.",
};

export default function DuzensizlikSimulatoruPage() {
  return <IrregularityStudioShell />;
}
