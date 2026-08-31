import { z } from "zod";

export const CAD_REVIEW_SCHEMA_VERSION = 1;

export const MAX_REVIEW_ITEMS_PER_DRAWING = 2000;
export const MAX_POINTS_PER_ITEM = 5000;
export const MAX_TEXT_LENGTH = 4000;
export const MAX_COMMENT_LENGTH = 4000;
export const MAX_AUTHOR_LENGTH = 120;

// Coordinate validation: finite, within reasonable CAD bounds
const cadCoordinateSchema = z.number().refine(
  (n) => Number.isFinite(n) && Math.abs(n) <= 1e9,
  { message: "Geçersiz veya sınır dışı CAD koordinatı." }
);

export const cadPoint2dSchema = z.object({
  x: cadCoordinateSchema,
  y: cadCoordinateSchema,
});

export type CadPoint2d = z.infer<typeof cadPoint2dSchema>;

export const cadReviewItemStatusSchema = z.enum(["open", "question", "answered", "closed"]);
export type CadReviewItemStatus = z.infer<typeof cadReviewItemStatusSchema>;

export const cadReviewLineDashSchema = z.enum(["continuous", "dashed", "dotted"]).default("continuous");
export type CadReviewLineDash = z.infer<typeof cadReviewLineDashSchema>;

export const cadReviewItemStyleSchema = z.object({
  color: z.string().min(1).max(32).default("#ff3b30"),
  strokeWidth: z.number().min(0.5).max(100).default(2),
  lineDash: cadReviewLineDashSchema.optional(),
  fontSize: z.number().min(6).max(200).optional(),
  fillColor: z.string().max(32).optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  opacity: z.number().min(0).max(1).default(1),
});

export type CadReviewItemStyle = z.infer<typeof cadReviewItemStyleSchema>;

// Base properties for every review item
const cadReviewItemBaseSchema = z.object({
  id: z.string().uuid(),
  layoutId: z.string().max(128).optional(),
  label: z.string().max(128).optional(),
  author: z.string().min(1).max(MAX_AUTHOR_LENGTH).default("Admin"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: cadReviewItemStatusSchema.default("open"),
  comment: z.string().max(MAX_COMMENT_LENGTH).default(""),
  style: cadReviewItemStyleSchema.default({
    color: "#ff3b30",
    strokeWidth: 2,
    opacity: 1,
  }),
});

// 1. Distance Measurement item
export const cadReviewDistanceItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("distance"),
  start: cadPoint2dSchema,
  end: cadPoint2dSchema,
  measuredLength: z.number().refine((n) => Number.isFinite(n) && n >= 0, {
    message: "Ölçüm mesafesi pozitif ve sonlu olmalıdır.",
  }),
});

// 2. Chain Distance Measurement item
export const cadReviewChainDistanceItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("chain_distance"),
  points: z.array(cadPoint2dSchema).min(2).max(MAX_POINTS_PER_ITEM),
  totalDistance: z.number().refine((n) => Number.isFinite(n) && n >= 0, {
    message: "Toplam zincir mesafesi pozitif ve sonlu olmalıdır.",
  }),
  segmentDistances: z.array(z.number().refine((n) => Number.isFinite(n) && n >= 0)),
});

// 3. Area Measurement item
export const cadReviewAreaItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("area"),
  points: z.array(cadPoint2dSchema).min(3).max(MAX_POINTS_PER_ITEM),
  measuredArea: z.number().refine((n) => Number.isFinite(n) && n >= 0, {
    message: "Alan değeri pozitif ve sonlu olmalıdır.",
  }),
  measuredPerimeter: z.number().refine((n) => Number.isFinite(n) && n >= 0, {
    message: "Çevre değeri pozitif ve sonlu olmalıdır.",
  }),
});

// 4. Comment Pin item
export const cadReviewPinItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("comment_pin"),
  position: cadPoint2dSchema,
  pinIndex: z.number().int().min(1),
  title: z.string().max(256).default("Yorum"),
});

// 5. Text item
export const cadReviewTextItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("text"),
  position: cadPoint2dSchema,
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  rotationDeg: z.number().refine(Number.isFinite).default(0),
});

// 6. Callout item (arrow leader + text bubble)
export const cadReviewCalloutItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("callout"),
  tip: cadPoint2dSchema,
  anchor: cadPoint2dSchema,
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
});

// 7. Shape items (rect, circle, cloud)
export const cadReviewShapeItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("shape"),
  shapeKind: z.enum(["rect", "circle", "cloud"]),
  p1: cadPoint2dSchema,
  p2: cadPoint2dSchema,
  radius: z.number().refine((n) => Number.isFinite(n) && n >= 0).optional(),
});

// 8. Freehand stroke item
export const cadReviewStrokeItemSchema = cadReviewItemBaseSchema.extend({
  type: z.literal("stroke"),
  points: z.array(cadPoint2dSchema).min(2).max(MAX_POINTS_PER_ITEM),
  smooth: z.boolean().default(true),
});

export const cadReviewItemSchema = z.discriminatedUnion("type", [
  cadReviewDistanceItemSchema,
  cadReviewChainDistanceItemSchema,
  cadReviewAreaItemSchema,
  cadReviewPinItemSchema,
  cadReviewTextItemSchema,
  cadReviewCalloutItemSchema,
  cadReviewShapeItemSchema,
  cadReviewStrokeItemSchema,
]);

export type CadReviewItem = z.infer<typeof cadReviewItemSchema>;

// Document Envelope
export const cadReviewDocumentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  fileId: z.string().uuid(),
  sourceVersionKey: z.string().min(1).max(1200),
  sourceSha256: z.string().length(64),
  revision: z.number().int().min(0).default(0),
  items: z.array(cadReviewItemSchema).max(MAX_REVIEW_ITEMS_PER_DRAWING).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CadReviewDocument = z.infer<typeof cadReviewDocumentSchema>;

export const cadReviewPayloadSchema = z.object({
  fileId: z.string().uuid(),
  sourceVersionKey: z.string().min(1).max(1200),
  sourceSha256: z.string().length(64),
  expectedRevision: z.number().int().min(0),
  items: z.array(cadReviewItemSchema).max(MAX_REVIEW_ITEMS_PER_DRAWING),
});

export type CadReviewPayload = z.infer<typeof cadReviewPayloadSchema>;

const CAD_REVIEW_STORAGE_PREFIX = "dok_cad_review_v1_";

/**
 * Loads locally persisted review document for offline / instant recovery.
 */
export function loadLocalCadReview(fileId: string): CadReviewDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${CAD_REVIEW_STORAGE_PREFIX}${fileId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      return parsed as CadReviewDocument;
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

/**
 * Saves review document directly to browser local storage for persistent recovery.
 */
export function saveLocalCadReview(fileId: string, doc: CadReviewDocument): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${CAD_REVIEW_STORAGE_PREFIX}${fileId}`,
      JSON.stringify(doc)
    );
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Clears local review document cache.
 */
export function clearLocalCadReview(fileId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${CAD_REVIEW_STORAGE_PREFIX}${fileId}`);
  } catch {
    // ignore
  }
}
