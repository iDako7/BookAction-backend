import { PrismaClient, Prisma } from "@prisma/client/";

/** Concept with tutorial relation included */
export type ConceptWithTutorial = Prisma.ConceptGetPayload<{
  include: { tutorial: true };
}>;

/** Concept with quizzes relation included */
export type ConceptWithQuizzes = Prisma.ConceptGetPayload<{
  include: { quizzes: true };
}>;

/** Concept with summary relation included */
export type ConceptWithSummary = Prisma.ConceptGetPayload<{
  include: { summary: true };
}>;

/** Maps relation names to their corresponding Prisma payload types */
export type ConceptRelationMap = {
  tutorial: ConceptWithTutorial;
  quizzes: ConceptWithQuizzes;
  summary: ConceptWithSummary;
};

/** Valid relation types for Concept queries */
export type ConceptSubTypes = keyof ConceptRelationMap;

/**
 * Repository for Concept entity data access operations.
 * Provides methods to fetch concepts with specific relations.
 */
export class ConceptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Finds a concept by ID with tutorial relation included.
   * @param conceptId - The concept ID to search for
   * @returns Concept with tutorial or null if not found
   */
  async findWithTutorial(
    conceptId: number
  ): Promise<ConceptWithTutorial | null> {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { tutorial: true },
    });
  }

  /**
   * Finds a concept by ID with quizzes relation included.
   * @param conceptId - The concept ID to search for
   * @returns Concept with quizzes or null if not found
   */
  async findWithQuizzes(conceptId: number): Promise<ConceptWithQuizzes | null> {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { quizzes: true },
    });
  }

  /**
   * Finds a concept by ID with summary relation included.
   * @param conceptId - The concept ID to search for
   * @returns Concept with summary or null if not found
   */
  async findWithSummary(conceptId: number): Promise<ConceptWithSummary | null> {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { summary: true },
    });
  }
}
