import { PrismaClient } from "@prisma/client";

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

  async returnHomepage() {
    // find modules
    const modules = await this.prisma.module.findMany({
      orderBy: { order_index: "asc" },
      include: {
        theme: true,
        concepts: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return {
      modules: modules.map((module) => ({
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
        progress: 0,
        concepts: module.concepts.map((c) => ({
          id: c.id,
          title: c.title,
          completed: false,
        })),
      })),
    };
  }
}
