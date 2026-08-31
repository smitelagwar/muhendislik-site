import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
} from "./schema";
import {
  filterReviewItems,
  type CadExportFilters,
} from "./export-contract";

export { filterReviewItems } from "./export-contract";
export type { CadExportFilters } from "./export-contract";

/**
 * Serializes a CAD review document to a formatted, schema-validated JSON string.
 */
export function exportReviewToJson(
  document: CadReviewDocument,
  filters?: CadExportFilters
): string {
  const filteredItems = filterReviewItems(document.items, filters);
  const exportDoc: CadReviewDocument = {
    ...document,
    items: filteredItems,
  };

  const validated = cadReviewDocumentSchema.parse(exportDoc);
  return JSON.stringify(validated, null, 2);
}

/**
 * Parses and validates an imported JSON string against cadReviewDocumentSchema.
 */
export function importReviewFromJson(jsonString: string): CadReviewDocument {
  const parsed = JSON.parse(jsonString);
  return cadReviewDocumentSchema.parse(parsed);
}
