/**
 * Feature flag configuration for CAD Review Workspace V1.
 */
export interface CadReviewFeatureFlags {
  cadReviewToolsV1: boolean;
  cadReviewExportV1: boolean;
}

export function getCadReviewFeatureFlags(): CadReviewFeatureFlags {
  // Reads optional NEXT_PUBLIC environment flags or defaults to true in V1 production
  const reviewEnv = process.env.NEXT_PUBLIC_CAD_REVIEW_V1;
  const exportEnv = process.env.NEXT_PUBLIC_CAD_REVIEW_EXPORT_V1;

  return {
    cadReviewToolsV1: reviewEnv !== "false" && reviewEnv !== "0",
    cadReviewExportV1: exportEnv !== "false" && exportEnv !== "0",
  };
}

export function isCadReviewEnabled(): boolean {
  return getCadReviewFeatureFlags().cadReviewToolsV1;
}

export function isCadExportEnabled(): boolean {
  return getCadReviewFeatureFlags().cadReviewExportV1;
}