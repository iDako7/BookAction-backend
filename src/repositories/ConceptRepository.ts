import { PrismaClient } from "@prisma/client/";

export class ConceptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findConceptWithQuizzes(conceptId: number) {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { quizzes: true },
    });
  }
}
