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
}
