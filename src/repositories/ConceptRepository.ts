import { PrismaClient, Prisma } from "@prisma/client/";

export type ConceptRelation = "tutorial" | "quizzes";

export type ConceptWithTutorial = Prisma.ConceptGetPayload<{
  include: { tutorial: true };
}>;

export type ConceptWithQuizzes = Prisma.ConceptGetPayload<{
  include: { quizzes: true };
}>;

export class ConceptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findWithTutorial(
    conceptId: number
  ): Promise<ConceptWithTutorial | null> {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { tutorial: true },
    });
  }

  async findWithQuizzes(conceptId: number): Promise<ConceptWithQuizzes | null> {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { quizzes: true },
    });
  }
}
