import { PrismaClient, LearningStyle } from "../../generated/prisma/client.js";

export interface LearningProfileData {
  userId: number;
  primaryStyle: LearningStyle;
  styleScores: Record<string, number>;
  quizResponses: string[];
}

export interface LearningProfileResult {
  primaryStyle: string;
  scores: Record<string, number>;
}

export class LearningProfileRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async upsert(data: LearningProfileData): Promise<void> {
    await this.prisma.user_learning_profile.upsert({
      where: { user_id: data.userId },
      create: {
        user_id: data.userId,
        primary_style: data.primaryStyle,
        style_scores: data.styleScores,
        quiz_responses: data.quizResponses,
      },
      update: {
        primary_style: data.primaryStyle,
        style_scores: data.styleScores,
        quiz_responses: data.quizResponses,
      },
    });
  }

  async findByUserId(userId: number): Promise<LearningProfileResult | null> {
    const profile = await this.prisma.user_learning_profile.findUnique({
      where: { user_id: userId },
      select: {
        primary_style: true,
        style_scores: true,
      },
    });

    if (!profile) return null;

    return {
      primaryStyle: profile.primary_style,
      scores: profile.style_scores as Record<string, number>,
    };
  }
}
