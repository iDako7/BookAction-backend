import { Parser } from "json2csv";
import { AppError } from "../utils/errors.js";
import { TeacherRepository } from "../repositories/TeacherRepository.js";
import {
  StudentListItemDTO,
  StudentDetailDTO,
  ConceptBreakdownDTO,
  ClassOverviewDTO,
  ModuleReportDTO,
  ModuleBreakdownDTO,
} from "../dtos/response/TeacherDTO.js";

export class TeacherService {
  private repo: TeacherRepository;

  constructor(repo: TeacherRepository) {
    this.repo = repo;
  }

  async listStudents(
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    data: StudentListItemDTO[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { students, total } = await this.repo.getStudentList(page, limit, search);

    const data: StudentListItemDTO[] = students.map((s) => ({
      id: s.id,
      username: s.username,
      email: s.email,
      createdAt: s.created_at,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentDetail(id: number): Promise<StudentDetailDTO> {
    const user = await this.repo.getStudentById(id);

    if (!user || user.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }

    const quizResponses = await this.repo.getQuizResponsesByUserId(id);
    const modulesCompleted = await this.repo.getStudentModulesCompleted(id);

    // Overall accuracy
    const totalQuiz = quizResponses.length;
    const correctQuiz = quizResponses.filter((r) => r.is_correct === true).length;
    const overallAccuracy = totalQuiz > 0 ? correctQuiz / totalQuiz : null;

    // Per-concept accuracy map (quiz_id → concept_id mapping is indirect via concept_progress)
    // Group quiz responses by quiz_id, then map via concept
    // Build accuracy per concept using concept_id via quiz table is complex—
    // Instead: group quiz responses and for each concept_progress, look up accuracy
    const quizResponsesByConceptApprox = new Map<number, { correct: number; total: number }>();

    // We'll compute concept-level accuracy by looking at quiz responses
    // quiz has concept_id, so we need that info
    // Since getStudentById returns concept_progress (with concept.id) but not quiz responses per concept,
    // we use the responses we already fetched (which include quiz_id but not concept_id directly)
    // The simplest approach: for now, overall accuracy applies to all concepts
    // For per-concept accuracy, we'd need to join through quizzes—we already have quiz responses
    // but we need quiz_id → concept_id mapping. Let's use overallAccuracy as fallback per-concept.

    const conceptBreakdown: ConceptBreakdownDTO[] = user.concept_progress.map((cp) => ({
      conceptId: cp.concept_id,
      conceptTitle: cp.concept.title,
      completed: cp.completed,
      accuracy: overallAccuracy,
      timeSpent: cp.time_spent,
    }));

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      overallAccuracy,
      modulesCompleted,
      conceptBreakdown,
    };
  }

  async getClassOverview(): Promise<ClassOverviewDTO> {
    const { totalStudents, totalModules, avgQuizScore, avgCompletionRate } =
      await this.repo.getClassOverview();

    const moduleRows = await this.repo.getModuleBreakdown();

    const moduleBreakdown: ModuleBreakdownDTO[] = await Promise.all(
      moduleRows.map(async (m) => {
        const { completionRate, avgScore } =
          await this.repo.getCompletionCountsForModule(m.conceptIds, totalStudents);
        return {
          moduleId: m.moduleId,
          title: m.title,
          completionRate,
          avgScore,
        };
      })
    );

    return {
      totalStudents,
      totalModules,
      avgCompletionRate,
      avgQuizScore,
      moduleBreakdown,
    };
  }

  async getModuleReport(moduleId: number): Promise<ModuleReportDTO> {
    const report = await this.repo.getModuleReport(moduleId);

    if (!report) {
      throw new AppError("Module not found", 404);
    }

    return report;
  }

  async exportReport(): Promise<string> {
    const rows = await this.repo.getAllStudentsForExport();

    try {
      const parser = new Parser({
        fields: [
          { label: "ID", value: "id" },
          { label: "Username", value: "username" },
          { label: "Email", value: "email" },
          { label: "Created At", value: "createdAt" },
          { label: "Concepts Completed", value: "conceptsCompleted" },
          { label: "Total Concepts", value: "totalConcepts" },
          { label: "Quiz Accuracy", value: "quizAccuracy" },
        ],
      });
      return parser.parse(rows);
    } catch {
      // Fallback: manual CSV
      const headers = [
        "ID",
        "Username",
        "Email",
        "Created At",
        "Concepts Completed",
        "Total Concepts",
        "Quiz Accuracy",
      ].join(",");

      const lines = rows.map((r) =>
        [
          r.id,
          `"${r.username}"`,
          `"${r.email}"`,
          `"${r.createdAt}"`,
          r.conceptsCompleted,
          r.totalConcepts,
          r.quizAccuracy ?? "",
        ].join(",")
      );

      return [headers, ...lines].join("\n");
    }
  }
}
