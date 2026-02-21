/**
 * DTOs for the Medal System (Phase 1).
 * GET /api/medals returns MedalSummaryDTO.
 */

export type ConceptMedalDTO = {
  conceptId: number;
  tier: string;
  accuracy: number;
};

export type ModuleMedalDTO = {
  moduleId: number;
  tier: string;
  accuracy: number;
};

export type MedalSummaryDTO = {
  conceptMedals: ConceptMedalDTO[];
  moduleMedals: ModuleMedalDTO[];
};
