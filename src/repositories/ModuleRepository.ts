import { PrismaClient } from "@prisma/client";
import type { ReflectionResDTO } from "../dtos/request/ReflectionDTO";
import { RESPONSE_TYPES } from "../constants/responseTypes";

export class ModuleRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findModuleWithTheme(moduleId: number) {
    return this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { theme: true },
    });
  }

  async findModuleReflection(moduleId: number, userId = 1) {
    return this.prisma.reflection.findFirst({
      where: {
        module_id: moduleId,
        user_id: userId,
      },
    });
  }

  async returnModulesOverview(userId: number) {
    // find modules with user-specific progress
    const modules = await this.prisma.module.findMany({
      orderBy: { order_index: "asc" },
      include: {
        theme: true,
        concepts: {
          orderBy: { order_index: "asc" },
          // Include progress ONLY for the requested user
          include: {
            User_concept_progress: {
              where: { user_id: userId },
            },
          },
        },
      },
    });

    // Transform raw Prisma result to include the specific user's progress
    return {
      modules: modules.map((module) => {
        // Calculate module-level progress based on completed concepts
        const totalConcepts = module.concepts.length;
        const completedConcepts = module.concepts.filter(
          (c) => c.User_concept_progress[0]?.completed ?? false
        ).length;
        const moduleProgress =
          totalConcepts > 0
            ? Math.round((completedConcepts / totalConcepts) * 100)
            : 0;

        return {
          id: module.id,
          title: module.title,
          theme: module.theme
            ? {
                title: module.theme.title,
                context: module.theme.context,
                mediaUrl: module.theme.media_url,
                mediaType: module.theme.media_type,
                question: module.theme.question,
              }
            : null,
          progress: moduleProgress,
          concepts: module.concepts.map((c) => ({
            id: c.id,
            title: c.title,
            // Check if the user has a progress record and if it is completed
            completed: c.User_concept_progress[0]?.completed ?? false,
          })),
        };
      }),
    };
  }

  // asynchronous saveModuleReflection(moduleId:)
  async saveModuleReflectionRes(resData: ReflectionResDTO) {
    await this.prisma.user_response.create({
      data: {
        reflection_id: resData.reflectionId,
        user_id: resData.userId,
        response_type: RESPONSE_TYPES.REFLECTION,
        text_answer: resData.responseText,
        time_spent: resData.timeSpentSeconds ?? null,
      },
    });
  }
}
