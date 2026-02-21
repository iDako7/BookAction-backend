import { PrismaClient, LearningStyle } from "../../generated/prisma/client.js";

export interface PracticeQuestion {
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export class PracticeCacheRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findValid(
    conceptId: number,
    learningStyle: LearningStyle
  ): Promise<PracticeQuestion[] | null> {
    const entry = await this.prisma.aI_practice_cache.findUnique({
      where: {
        concept_id_learning_style: {
          concept_id: conceptId,
          learning_style: learningStyle,
        },
      },
      select: {
        generated_content: true,
        expires_at: true,
      },
    });

    if (!entry) return null;
    if (entry.expires_at.getTime() <= Date.now()) return null;

    return entry.generated_content as unknown as PracticeQuestion[];
  }

  async upsert(
    conceptId: number,
    learningStyle: LearningStyle,
    questions: PracticeQuestion[],
    ttlMs: number = 24 * 60 * 60 * 1000
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.aI_practice_cache.upsert({
      where: {
        concept_id_learning_style: {
          concept_id: conceptId,
          learning_style: learningStyle,
        },
      },
      create: {
        concept_id: conceptId,
        learning_style: learningStyle,
        generated_content: questions as unknown as object,
        expires_at: expiresAt,
      },
      update: {
        generated_content: questions as unknown as object,
        expires_at: expiresAt,
      },
    });
  }
}
