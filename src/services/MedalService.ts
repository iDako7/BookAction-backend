import {
  calculateMedalTier,
  MedalTier,
} from "../constants/medalThresholds.js";
import { MedalRepository } from "../repositories/MedalRepository.js";
import type { MedalSummaryDTO } from "../dtos/response/MedalDTO.js";
import { MedalTier as PrismaMedalTier } from "../../generated/prisma/client.js";

export class MedalService {
  private medalRepo: MedalRepository;

  constructor(medalRepo: MedalRepository) {
    this.medalRepo = medalRepo;
  }

  /**
   * Award (or upgrade) a concept medal when a student marks a concept complete.
   * Also checks if the entire module is now complete and awards a module medal if so.
   *
   * Accuracy = average of all quiz scores submitted by this user for this concept.
   */
  async awardConceptMedal(userId: number, conceptId: number): Promise<void> {
    // 1. Calculate average accuracy across all quiz submissions for this concept
    const accuracy = await this.medalRepo.getConceptAvgAccuracy(
      userId,
      conceptId
    );

    // 2. Determine tier (no quiz submissions → accuracy=0 → NONE, still upsert)
    const tier = calculateMedalTier(accuracy);

    // 3. Upsert concept medal (upgrade-only — never downgrades)
    await this.medalRepo.upsertConceptMedal(
      userId,
      conceptId,
      tier as PrismaMedalTier,
      accuracy
    );

    // 4. Check if all concepts in this module are now completed by this user
    await this.checkAndAwardModuleMedal(userId, conceptId);
  }

  /**
   * Checks if all concepts in the module containing `conceptId` are completed
   * by `userId`. If so, awards (or upgrades) a module medal.
   */
  private async checkAndAwardModuleMedal(
    userId: number,
    conceptId: number
  ): Promise<void> {
    // Get the module this concept belongs to
    const moduleId = await this.medalRepo.getModuleIdForConcept(conceptId);
    if (moduleId === null) return;

    // Get all concept IDs in this module
    const conceptIds = await this.medalRepo.getConceptIdsByModule(moduleId);
    if (conceptIds.length === 0) return;

    // Parallelize independent queries: completion count + concept medals
    const [completedCount, conceptMedals] = await Promise.all([
      this.medalRepo.countCompletedConcepts(userId, conceptIds),
      this.medalRepo.getConceptMedalsForConcepts(userId, conceptIds),
    ]);

    // Only award module medal when ALL concepts are completed
    if (completedCount < conceptIds.length) return;

    if (conceptMedals.length === 0) return;

    const avgAccuracy =
      conceptMedals.reduce((sum, m) => sum + m.accuracy, 0) /
      conceptMedals.length;

    const moduleTier = calculateMedalTier(avgAccuracy);

    await this.medalRepo.upsertModuleMedal(
      userId,
      moduleId,
      moduleTier as PrismaMedalTier,
      avgAccuracy
    );
  }

  /**
   * Returns all concept and module medals for a user.
   */
  async getUserMedalSummary(userId: number): Promise<MedalSummaryDTO> {
    return this.medalRepo.findUserMedals(userId);
  }
}
