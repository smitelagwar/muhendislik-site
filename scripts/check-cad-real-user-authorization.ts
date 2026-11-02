export const CAD_REAL_USER_RELEASE_ACK_ENV = "CAD_REAL_USER_RELEASE_AUTHORIZED";

/** Return why a real-user release gate must stop before it reads user data. */
export function getCadRealUserReleaseBlockReason(
  environment: NodeJS.ProcessEnv = process.env
): string | null {
  if (environment[CAD_REAL_USER_RELEASE_ACK_ENV] !== "1") {
    return `${CAD_REAL_USER_RELEASE_ACK_ENV}=1 acknowledgment is required before reading .data/dok_db.json or writing release evidence.`;
  }
  return null;
}
