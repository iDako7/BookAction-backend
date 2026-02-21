export interface StudentListItemDTO {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

export interface ConceptBreakdownDTO {
  conceptId: number;
  conceptTitle: string;
  completed: boolean;
  accuracy: number | null;
  timeSpent: number;
}

export interface StudentDetailDTO {
  id: number;
  username: string;
  email: string;
  overallAccuracy: number | null;
  modulesCompleted: number;
  conceptBreakdown: ConceptBreakdownDTO[];
}

export interface ModuleBreakdownDTO {
  moduleId: number;
  title: string;
  completionRate: number;
  avgScore: number | null;
}

export interface ClassOverviewDTO {
  totalStudents: number;
  totalModules: number;
  avgCompletionRate: number;
  avgQuizScore: number | null;
  moduleBreakdown: ModuleBreakdownDTO[];
}

export interface ModuleReportDTO {
  completionRate: number;
  avgScore: number | null;
  avgTimeSpent: number;
}
