export function acceptsL11ProductionRelease(input: {
  executionMode: string;
  performanceResult: string;
  qualityStatus: string;
}): boolean {
  return input.executionMode === "production-release" &&
    input.performanceResult === "PASS" &&
    input.qualityStatus === "exact";
}
