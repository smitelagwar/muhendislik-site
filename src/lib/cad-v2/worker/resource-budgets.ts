/** Shared limits for memory owned by the CAD V2 worker pipeline. */
export const CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES = 8 * 1024 * 1024;

/**
 * Bounds the sum of manifest-declared chunk bytes being fetched, hashed, decoded,
 * and admitted at once. This is a transient transfer bound, not a total heap cap.
 */
export const CAD_V2_IN_FLIGHT_CHUNK_TRANSFER_BUDGET_BYTES = 16 * 1024 * 1024;

export const CAD_V2_REFINEMENT_CACHE_MISS_ERROR_PREFIX = "REFINEMENT_SOURCE_CACHE_MISS:";
