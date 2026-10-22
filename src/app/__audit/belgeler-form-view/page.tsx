"use client";
import { SozlesmeStudio } from "@/components/sozlesme-studio";
export default function AuditModalFixture() {
  if (process.env.NODE_ENV !== "development") return <p>Only available in test development mode</p>;
  return (
    <main aria-label="Yalnız izole denetim dalı fixture'ı" className="grid h-[95vh] grid-cols-2 gap-2">
      <section data-testid="audit-modal-a"><SozlesmeStudio isModal /></section>
      <section data-testid="audit-modal-b"><SozlesmeStudio isModal /></section>
    </main>
  );
}
