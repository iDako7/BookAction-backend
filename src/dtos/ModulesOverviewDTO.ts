import type { ThemeDTO } from "./ModuleThemeDTO";

interface ModuleConceptDTO {
  id: number;
  title: string;
  completed: boolean;
}

export interface ModuleOverviewDTO {
  id: number;
  title: string;
  theme: ThemeDTO | null;
  progress: number;
  concepts: ModuleConceptDTO[];
}

export interface ModulesOverviewDTO {
  modules: ModuleOverviewDTO[];
}
