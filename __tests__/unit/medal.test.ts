/**
 * Unit tests for calculateMedalTier pure function.
 *
 * Assumptions:
 * - calculateMedalTier is exported from src/constants/medalThresholds.ts
 * - MedalTier values are string literals: "NONE" | "BRONZE" | "SILVER" | "GOLD"
 * - Thresholds: GOLD >= 0.90, SILVER >= 0.70, BRONZE >= 0.50, else NONE
 * - Function accepts a number (expected range [0, 1])
 */
import { calculateMedalTier } from "../../src/constants/medalThresholds.js";

describe("calculateMedalTier", () => {
  describe("GOLD tier (accuracy >= 0.90)", () => {
    it("FR-1.1: returns GOLD for 0.91", () => {
      expect(calculateMedalTier(0.91)).toBe("GOLD");
    });

    it("FR-1.2: returns GOLD at lower boundary 0.90", () => {
      expect(calculateMedalTier(0.90)).toBe("GOLD");
    });

    it("FR-1.7: returns GOLD for perfect score 1.0", () => {
      expect(calculateMedalTier(1.0)).toBe("GOLD");
    });
  });

  describe("SILVER tier (0.70 <= accuracy < 0.90)", () => {
    it("FR-1.3: returns SILVER at lower boundary 0.70", () => {
      expect(calculateMedalTier(0.70)).toBe("SILVER");
    });

    it("returns SILVER for 0.75 (mid-range)", () => {
      expect(calculateMedalTier(0.75)).toBe("SILVER");
    });

    it("returns SILVER for 0.89 (just below GOLD boundary)", () => {
      expect(calculateMedalTier(0.89)).toBe("SILVER");
    });
  });

  describe("BRONZE tier (0.50 <= accuracy < 0.70)", () => {
    it("FR-1.4: returns BRONZE at lower boundary 0.50", () => {
      expect(calculateMedalTier(0.50)).toBe("BRONZE");
    });

    it("returns BRONZE for 0.60 (mid-range)", () => {
      expect(calculateMedalTier(0.60)).toBe("BRONZE");
    });

    it("returns BRONZE for 0.69 (just below SILVER boundary)", () => {
      expect(calculateMedalTier(0.69)).toBe("BRONZE");
    });
  });

  describe("NONE tier (accuracy < 0.50)", () => {
    it("FR-1.5: returns NONE for 0.49 (just below BRONZE boundary)", () => {
      expect(calculateMedalTier(0.49)).toBe("NONE");
    });

    it("FR-1.6: returns NONE for 0.0", () => {
      expect(calculateMedalTier(0.0)).toBe("NONE");
    });

    it("returns NONE for negative input", () => {
      expect(calculateMedalTier(-0.1)).toBe("NONE");
    });
  });
});
