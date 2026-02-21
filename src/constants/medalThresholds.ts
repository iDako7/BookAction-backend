/**
 * Medal tier thresholds and pure calculation function.
 * Used by both unit tests and MedalService.
 */

export const MEDAL_THRESHOLDS = {
  GOLD: 0.9,
  SILVER: 0.7,
  BRONZE: 0.5,
} as const;

export type MedalTier = "GOLD" | "SILVER" | "BRONZE" | "NONE";

/**
 * Pure function: maps an accuracy score [0, 1] to a MedalTier.
 * GOLD   >= 0.90
 * SILVER >= 0.70
 * BRONZE >= 0.50
 * NONE    < 0.50
 */
export function calculateMedalTier(accuracy: number): MedalTier {
  if (accuracy >= MEDAL_THRESHOLDS.GOLD) return "GOLD";
  if (accuracy >= MEDAL_THRESHOLDS.SILVER) return "SILVER";
  if (accuracy >= MEDAL_THRESHOLDS.BRONZE) return "BRONZE";
  return "NONE";
}
