import { BelgeFieldGuidanceView, evaluateFieldGuidance } from "./belge-field-guidance";
import { DOCUMENT_FIELD_POLICIES } from "@/lib/belgeler-field-guidance";
import type { BelgeDocumentId } from "@/lib/belgeler-pdf-profiles";
import type { PdfFieldLayouts } from "@/lib/belgeler-pdf-layout";

/** Alan altında rehberliği olmayan girdiler için aynı gerçek ölçüm sonucunu gösterir. */
export function BelgePdfLayoutWarnings({ documentId, layouts, excludedFields }: {
  documentId: BelgeDocumentId;
  layouts?: PdfFieldLayouts;
  excludedFields: readonly string[];
}) {
  const policies: Record<string, { label: string }> = DOCUMENT_FIELD_POLICIES[documentId];
  const warnings = Object.values(layouts ?? {}).flatMap((layout) => {
    if (!policies[layout.fieldKey] || excludedFields.includes(layout.fieldKey)) return [];
    const guidance = evaluateFieldGuidance(documentId, layout.fieldKey, layout.value, { layout });
    return guidance?.source === "readability" ? [{ layout, guidance }] : [];
  });
  if (!warnings.length) return null;
  return <div data-testid="belge-pdf-layout-warnings" className="mx-2 mt-2 space-y-1">
    {warnings.map(({ layout, guidance }) => <div key={layout.fieldKey} data-field-key={layout.fieldKey}>
      <p className="text-xs font-semibold">{policies[layout.fieldKey].label}</p>
      <BelgeFieldGuidanceView guidance={guidance} />
    </div>)}
  </div>;
}
