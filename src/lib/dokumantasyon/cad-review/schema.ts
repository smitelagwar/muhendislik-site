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
  { message: "Ge癟ersiz veya s覺n覺r d覺��覺 CAD koordinat覺." }
);

export const cadPoint2dSchema = z.object({
  x: cadCoordinateSchema,
  y: cadCoordinateSchema,
});

export type CadPoint2d = z.infer<typeof cadPoint2dSchema>;

export const cadReviewItemStatusSchema = z.enum(["open", "question", "answered", "closed"]);
export type CadReviewItemStatus = z.infer<typeof cadReviewItemStatusSchema>;

export const cadReviewLineDashSchema = z.enum(["continuous", "dashed", "dotted"]);
export type CadReviewLineDash = z.infer<typeof cadReviewLineDashSchema>;

export const cadReviewItemStyleSchema = z.object({
  color: z.string().min(1).max(32).default("#ff3b30"),
  strokeWidth: z.number().min(0.5).max(100).default(2),
  lineDash: cadReviewLineDashSchema.optional(),
  fontSize: z.number().min(6).max(200).optional(),
  fillColor: z.string().max(32).optional(),
  opacity: z.number().min(0).max(1).default(1),
});

export type CadReviewItemStyle = z.infer<typeof cadReviewItemStyleSchema>;

// Existing runtime chain IDs (chain-<timestamp>) and old review IDs m飩吼兗