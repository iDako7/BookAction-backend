/**
 * Unit tests for evaluateStyle pure function (FR-3.1, FR-3.2).
 *
 * Assumptions:
 * - evaluateStyle is exported as a named export from src/services/LearningStyleService.ts
 * - Input: array of style strings ('VISUAL' | 'VERBAL' | 'SCENARIO')
 *   representing the user's answer to each learning style quiz question
 * - Output: { primaryStyle: string, scores: { VISUAL: number, VERBAL: number, SCENARIO: number } }
 * - primaryStyle is the style with the highest count among the responses
 * - On a tie, the result is deterministic — calling the function twice with the same
 *   input always produces the same primaryStyle (not random)
 */
import { evaluateStyle } from "../../src/services/LearningStyleService.js";

describe("evaluateStyle", () => {
  // ─── FR-3.1: clear winner ─────────────────────────────────────────────────

  describe("FR-3.1: returns VISUAL when it has the highest count (5 VISUAL, 2 VERBAL, 1 SCENARIO)", () => {
    it("returns primaryStyle VISUAL", () => {
      const responses = [
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VERBAL",
        "VERBAL",
        "SCENARIO",
      ];
      const result = evaluateStyle(responses);
      expect(result.primaryStyle).toBe("VISUAL");
    });

    it("returns correct scores for each style", () => {
      const responses = [
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VERBAL",
        "VERBAL",
        "SCENARIO",
      ];
      const result = evaluateStyle(responses);
      expect(result.scores.VISUAL).toBe(5);
      expect(result.scores.VERBAL).toBe(2);
      expect(result.scores.SCENARIO).toBe(1);
    });
  });

  // ─── FR-3.2: tie → deterministic result ──────────────────────────────────

  describe("FR-3.2: tied scores → deterministic result (not random)", () => {
    it("returns the same primaryStyle on repeated calls with equal scores", () => {
      const responses = [
        "VISUAL",
        "VERBAL",
        "SCENARIO",
        "VISUAL",
        "VERBAL",
        "SCENARIO",
      ];
      const result1 = evaluateStyle(responses);
      const result2 = evaluateStyle(responses);
      // Both calls MUST return the same style — no randomness allowed
      expect(result1.primaryStyle).toBe(result2.primaryStyle);
    });

    it("returns a valid LearningStyle on any tie", () => {
      const responses = ["VISUAL", "VERBAL"];
      const result = evaluateStyle(responses);
      expect(["VISUAL", "VERBAL", "SCENARIO"]).toContain(result.primaryStyle);
    });

    it("deterministic with all three styles tied", () => {
      const responses = ["VISUAL", "VERBAL", "SCENARIO"];
      const first = evaluateStyle(responses);
      const second = evaluateStyle(responses);
      expect(first.primaryStyle).toBe(second.primaryStyle);
    });
  });

  // ─── Additional coverage ──────────────────────────────────────────────────

  describe("VERBAL and SCENARIO winners", () => {
    it("returns VERBAL when VERBAL has the most responses", () => {
      const responses = [
        "VERBAL",
        "VERBAL",
        "VERBAL",
        "VISUAL",
        "SCENARIO",
      ];
      const result = evaluateStyle(responses);
      expect(result.primaryStyle).toBe("VERBAL");
    });

    it("returns SCENARIO when SCENARIO has the most responses", () => {
      const responses = [
        "SCENARIO",
        "SCENARIO",
        "SCENARIO",
        "VISUAL",
        "VERBAL",
      ];
      const result = evaluateStyle(responses);
      expect(result.primaryStyle).toBe("SCENARIO");
    });
  });
});
