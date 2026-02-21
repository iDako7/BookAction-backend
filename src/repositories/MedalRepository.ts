import { PrismaClient, MedalTier } from "../../generated/prisma/client.js";
import type { MedalSummaryDTO } from "../dtos/response/MedalDTO.js";

/** Numeric rank for each tier — used to enforce the never-downgrade rule */
const TIER_RANK: Record<MedalTier, number> = {
  NONE: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
};

export class MedalRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Upsert a concept medal — upgrade only.
   * If an existing medal has an equal or higher tier, this is a no-op.
   */
  async upsertConceptMedal(
    userId: number,
    conceptId: number,
    tier: MedalTier,
    accuracy: number
  ): Promise<void> {
    const existing = await this.prisma.user_concept_medal.findUnique({
      where: { user_id_concept_id: { user_id: userId, concept_id: conceptId } },
      select: { tier: true },
    });

    if (existing && TIER_RANK[existing.tier] >= TIER_RANK[tier]) {
      // Current medal is equal or higher — do not downgrade
      return;
    }

    await this.prisma.user_concept_medal.upsert({
      where: { user_id_concept_id: { user_id: userId, concept_id: conceptId } },
      create: { user_id: userId, concept_id: conceptId, tier, accuracy },
      update: { tier, accuracy },
    });
  }

  /**
   * Upsert a module medal — upgrade only.
   */
  async upsertModuleMedal(
    userId: number,
    moduleId: number,
    tier: MedalTier,
    accuracy: number
  ): Promise<void> {
    const existing = await this.prisma.user_module_medal.findUnique({
      where: { user_id_module_id: { user_id: userId, module_id: moduleId } },
      select: { tier: true },
    });

    if (existing && TIER_RANK[existing.tier] >= TIER_RANK[tier]) {
      return;
    }

    await this.prisma.user_module_medal.upsert({
      where: { user_id_module_id: { user_id: userId, module_id: moduleId } },
      create: { user_id: userId, module_id: moduleId, tier, accuracy },
      update: { tier, accuracy },
    });
  }

  /**
   * Returns all concept + module medals for a user, formatted as DTOs.
   */
  async findUserMedals(userId: number): Promise<MedalSummaryDTO> {
    const [conceptMedals, moduleMedals] = await Promise.all([
      this.prisma.user_concept_medal.findMany({
        where: { user_id: userId },
        select: { concept_id: true, tier: true, accuracy: true },
      }),
      this.prisma.user_module_medal.findMany({
        where: { user_id: userId },
        select: { module_id: true, tier: true, accuracy: true },
      }),
    ]);

    return {
      conceptMedals: conceptMedals.map((m) => ({
        conceptId: m.concept_id,
        tier: m.tier,
        accuracy: m.accuracy,
      })),
      moduleMedals: moduleMedals.map((m) => ({
        moduleId: m.module_id,
        tier: m.tier,
        accuracy: m.accuracy,
      })),
    };
  }

  /**
   * Compute average quiz score for a user on a given concept.
   * Returns 0 if no responses exist.
   *
   * Each user_response.answer is JSON: { userAnswerIndices, correctOptionIndices, score }
   * We fetch the records and average the score field in-memory (since Prisma can't
   * aggregate inside JSON columns directly).
   */
  async getConceptAvgAccuracy(
    userId: number,
    conceptId: number
  ): Promise<number> {
    // Get all quiz IDs that belong to this concept
    const quizzes = await this.prisma.quiz.findMany({
      where: { concept_id: conceptId },
      select: { id: true },
    });

    if (quizzes.length === 0) return 0;

    const quizIds = quizzes.map((q) => q.id);

    // Fetch all quiz responses for this user on these quizzes
    const responses = await this.prisma.user_response.findMany({
      where: {
        user_id: userId,
        quiz_id: { in: quizIds },
      },
      select: { answer: true },
    });

    if (responses.length === 0) return 0;

    // Extract scores from JSON and average them
    const scores = responses
      .map((r) => {
        const answer = r.answer as { score?: number } | null;
        return typeof answer?.score === "number" ? answer.score : null;
      })
      .filter((s): s is number => s !== null);

    if (scores.length === 0) return 0;

    const total = scores.reduce((sum, s) => sum + s, 0);
    return total / scores.length;
  }

  /**
   * Returns all concept IDs belonging to a module.
   */
  async getConceptIdsByModule(moduleId: number): Promise<number[]> {
    const concepts = await this.prisma.concept.findMany({
      where: { module_id: moduleId },
      select: { id: true },
    });
    return concepts.map((c) => c.id);
  }

  /**
   * Returns the module_id for a given concept.
   */
  async getModuleIdForConcept(conceptId: number): Promise<number | null> {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      select: { module_id: true },
    });
    return concept?.module_id ?? null;
  }

  /**
   * Count how many of the given concepts are marked completed by the user
   * in user_concept_progress.
   */
  async countCompletedConcepts(
    userId: number,
    conceptIds: number[]
  ): Promise<number> {
    return this.prisma.user_concept_progress.count({
      where: {
        user_id: userId,
        concept_id: { in: conceptIds },
        completed: true,
      },
    });
  }

  /**
   * Fetch existing concept medals for a user on a set of concepts.
   * Used to calculate module medal accuracy (avg of concept medal accuracies).
   */
  async getConceptMedalsForConcepts(
    userId: number,
    conceptIds: number[]
  ): Promise<{ accuracy: number }[]> {
    return this.prisma.user_concept_medal.findMany({
      where: {
        user_id: userId,
        concept_id: { in: conceptIds },
      },
      select: { accuracy: true },
    });
  }
}
