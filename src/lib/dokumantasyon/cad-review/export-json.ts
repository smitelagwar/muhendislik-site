import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "./schema";

export interface CadExportFilters {
  includeMeasurements?: boolean;
  includeComments?: boolean;
  includeMarkup?: boolean;
  includeSketches?: boolean;
  includeResolved?: boolean;
  activeLayoutId?: string | null;
}

export function filterReviewItems(
  items: readonly CadReviewItem[],
  filters?: CadExportFilters
): CadReviewItem[] {
  if (!filters) return [...items];

  const includeMeasurements = filters.includeMeasurements ?? true;
  const includeComments = filters.includeComments ?? true;
  const includeMarkup = filters.includeMarkup ?? true;
  const includeSketches = filters.includeSketches ?? true;
  const includeResolved = filters.includeResolved ?? true;
  const activeLayoutId = filters.activeLayoutId;

  return items.filter((item) => {
    // Layout filter
    if (activeLayoutId && item.layoutId && item.layoutId !== activeLayoutId) {
      return false;
    }

    // Resolved filter
    if (!includeResolved && item.status === "closed") {
      return false;
    }

    // Type filters
    switch (item.type) {
      case "distance":
      case "chain_distance":
      case "area":
        return includeMeasurements;

      case "comment_pin":
        return includeComments;

      case "shape":
      case "callout":
      case "text":
        return includeMarkup;

      case "stroke":
        return includeSketches;

      default:
        return true;
    }
  });
}

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

  // Validate before serialization
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