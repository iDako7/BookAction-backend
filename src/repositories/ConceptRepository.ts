import { PrismaClient, Prisma } from "@prisma/client/";
import { AnswerToQuizDTO } from "../dtos/request/AnswerToQuizDTO";

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

  /**
   * Fetches a single quiz by its identifier.
   * Used to evaluate answers and persist user responses.
   */
  async findQuizById(quizId: number) {
    return this.prisma.quiz.findUnique({ where: { id: quizId } });
  }

  /**
   * Saves a quiz answer submission as a new record.
   * Each submission creates a unique record to maintain complete history.
   * @param data - The quiz answer data from the user
   * @returns The created user_response record
   */
  async saveQuizAnswersToDB(data: AnswerToQuizDTO) {
    return this.prisma.user_response.create({
      data: {
        quiz_id: data.quizId,
        user_id: data.userId,
        response_type: data.responseType,
        answer: data.answer as unknown as Prisma.InputJsonValue, // this allow us to transfer answer into prisma json. Setting type as unknown will allow us transfer datatype.
        is_correct: data.isCorrect ?? null,
        time_spent: data.timeSpentSeconds ?? null,
      },
    });
  }
}
