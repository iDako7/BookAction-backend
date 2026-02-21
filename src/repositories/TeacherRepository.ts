import { PrismaClient } from "../../generated/prisma/client.js";

export class TeacherRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getStudentList(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ students: { id: number; username: string; email: string; created_at: Date }[]; total: number }> {
    const where = {
      role: "STUDENT" as const,
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, username: true, email: true, created_at: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { students, total };
  }

  async getStudentById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        concept_progress: {
          select: {
            concept_id: true,
            completed: true,
            time_spent: true,
            concept: {
              select: { id: true, title: true, module_id: true },
            },
          },
        },
      },
    });
  }

  async getQuizResponsesByUserId(userId: number) {
    return this.prisma.user_response.findMany({
      where: { user_id: userId, response_type: "quiz" },
      select: { quiz_id: true, is_correct: true },
    });
  }

  async getStudentModulesCompleted(userId: number): Promise<number> {
    const modules = await this.prisma.module.findMany({
      where: { is_published: true },
      select: {
        id: true,
        concepts: {
          select: {
            id: true,
            User_concept_progress: {
              where: { user_id: userId },
              select: { completed: true },
            },
          },
        },
      },
    });

    let completed = 0;
    for (const mod of modules) {
      if (mod.concepts.length === 0) continue;
      const allDone = mod.concepts.every(
        (c) => c.User_concept_progress.length > 0 && c.User_concept_progress[0].completed
      );
      if (allDone) completed++;
    }
    return completed;
  }

  async getClassOverview() {
    const [totalStudents, totalModules, totalQuizResponses, correctQuizResponses] =
      await Promise.all([
        this.prisma.user.count({ where: { role: "STUDENT" } }),
        this.prisma.module.count({ where: { is_published: true } }),
        this.prisma.user_response.count({ where: { response_type: "quiz" } }),
        this.prisma.user_response.count({
          where: { response_type: "quiz", is_correct: true },
        }),
      ]);

    const avgQuizScore =
      totalQuizResponses > 0 ? correctQuizResponses / totalQuizResponses : null;

    // Per-user completion rate
    const students = await this.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });

    const totalConcepts = await this.prisma.concept.count();

    let sumCompletionRate = 0;
    if (students.length > 0 && totalConcepts > 0) {
      const progressCounts = await this.prisma.user_concept_progress.groupBy({
        by: ["user_id"],
        where: { completed: true },
        _count: { concept_id: true },
      });

      const progressMap = new Map(
        progressCounts.map((p) => [p.user_id, p._count.concept_id])
      );

      for (const s of students) {
        const done = progressMap.get(s.id) ?? 0;
        sumCompletionRate += done / totalConcepts;
      }
    }

    const avgCompletionRate =
      students.length > 0 ? sumCompletionRate / students.length : 0;

    return { totalStudents, totalModules, avgQuizScore, avgCompletionRate };
  }

  async getModuleBreakdown(): Promise<
    { moduleId: number; title: string; totalConcepts: number; conceptIds: number[] }[]
  > {
    const modules = await this.prisma.module.findMany({
      where: { is_published: true },
      select: {
        id: true,
        title: true,
        concepts: { select: { id: true } },
      },
      orderBy: { order_index: "asc" },
    });

    return modules.map((m) => ({
      moduleId: m.id,
      title: m.title,
      totalConcepts: m.concepts.length,
      conceptIds: m.concepts.map((c) => c.id),
    }));
  }

  async getCompletionCountsForModule(conceptIds: number[], totalStudents: number) {
    if (conceptIds.length === 0 || totalStudents === 0)
      return { completionRate: 0, avgScore: null };

    const students = await this.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });

    let fullyCompleted = 0;
    for (const s of students) {
      const count = await this.prisma.user_concept_progress.count({
        where: {
          user_id: s.id,
          concept_id: { in: conceptIds },
          completed: true,
        },
      });
      if (count === conceptIds.length) fullyCompleted++;
    }

    const completionRate = totalStudents > 0 ? fullyCompleted / totalStudents : 0;

    const [total, correct] = await Promise.all([
      this.prisma.user_response.count({
        where: { response_type: "quiz", quiz: { concept_id: { in: conceptIds } } },
      }),
      this.prisma.user_response.count({
        where: {
          response_type: "quiz",
          is_correct: true,
          quiz: { concept_id: { in: conceptIds } },
        },
      }),
    ]);

    const avgScore = total > 0 ? correct / total : null;

    return { completionRate, avgScore };
  }

  async getModuleReport(moduleId: number) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { concepts: { select: { id: true } } },
    });

    if (!module) return null;

    const conceptIds = module.concepts.map((c) => c.id);
    const totalStudents = await this.prisma.user.count({ where: { role: "STUDENT" } });

    const students = await this.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true },
    });

    let fullyCompleted = 0;
    if (conceptIds.length > 0) {
      for (const s of students) {
        const count = await this.prisma.user_concept_progress.count({
          where: {
            user_id: s.id,
            concept_id: { in: conceptIds },
            completed: true,
          },
        });
        if (count === conceptIds.length) fullyCompleted++;
      }
    }

    const completionRate = totalStudents > 0 ? fullyCompleted / totalStudents : 0;

    const [totalQuiz, correctQuiz] = await Promise.all([
      this.prisma.user_response.count({
        where: { response_type: "quiz", quiz: { concept_id: { in: conceptIds } } },
      }),
      this.prisma.user_response.count({
        where: {
          response_type: "quiz",
          is_correct: true,
          quiz: { concept_id: { in: conceptIds } },
        },
      }),
    ]);

    const avgScore = totalQuiz > 0 ? correctQuiz / totalQuiz : null;

    const timeAgg = await this.prisma.user_concept_progress.aggregate({
      where: { concept_id: { in: conceptIds } },
      _avg: { time_spent: true },
    });

    const avgTimeSpent = timeAgg._avg.time_spent ?? 0;

    return { completionRate, avgScore, avgTimeSpent };
  }

  async getAllStudentsForExport() {
    const students = await this.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
        concept_progress: { select: { completed: true } },
        response: {
          where: { response_type: "quiz" },
          select: { is_correct: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return students.map((s) => {
      const totalQuiz = s.response.length;
      const correctQuiz = s.response.filter((r) => r.is_correct === true).length;
      const completedConcepts = s.concept_progress.filter((p) => p.completed).length;
      const totalConcepts = s.concept_progress.length;
      const accuracy = totalQuiz > 0 ? correctQuiz / totalQuiz : null;

      return {
        id: s.id,
        username: s.username,
        email: s.email,
        createdAt: s.created_at,
        conceptsCompleted: completedConcepts,
        totalConcepts,
        quizAccuracy: accuracy !== null ? Math.round(accuracy * 100) / 100 : null,
      };
    });
  }
}
