import { PrismaClient } from "@prisma/client/";

export class ConceptRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findEntityWithCpt(conceptId: number) {
    return this.prisma.concept.findFirst({
      where: { id: conceptId },
      include: { tutorial: true, quizzes: true },
    });
  }
}
