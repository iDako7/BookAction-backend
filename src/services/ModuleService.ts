import { ModuleRepository } from "../repositories/ModuleRepository";
import type { ThemeDTO } from "../dtos/ModuleThemeDTO";
import type {
  ModulesOverviewDTO,
  ModuleOverviewDTO,
} from "../dtos/ModulesOverviewDTO";

export class ModuleService {
  private moduleRepo: ModuleRepository;

  constructor(moduleRepo: ModuleRepository) {
    this.moduleRepo = moduleRepo;
  }

  async getModuleTheme(moduleId: number): Promise<ThemeDTO> {
    // 1. get the data from repo
    const module = await this.moduleRepo.findModuleWithTheme(moduleId);

    // 2. validation
    if (!module || !module.theme) {
      throw new Error("Theme not found for module " + moduleId);
    }

    // 3. transform to DTO
    const themeDTO: ThemeDTO = {
      title: module.theme.title,
      context: module.theme.context,
      mediaUrl: module.theme.media_url,
      mediaType: module.theme.media_type,
      question: module.theme.question,
    };

    return themeDTO;
  }

  async getModulesOverview(): Promise<ModulesOverviewDTO> {
    // get the necessary data through repo layer
    const homePage = await this.moduleRepo.returnHomepage();

    // validation
    if (!homePage || !homePage.modules || homePage.modules.length === 0) {
      throw new Error("Homepage not found");
    }

    // transform to DTO
    const modules: ModuleOverviewDTO[] = homePage.modules.map((module) => {
      const themeDTO: ThemeDTO | null = module.theme
        ? {
            title: module.theme.title,
            context: module.theme.context,
            mediaUrl: module.theme.mediaUrl,
            mediaType: module.theme.mediaType,
            question: module.theme.question,
          }
        : null;

      // build moduleDTO
      return {
        id: module.id,
        title: module.title,
        theme: themeDTO,
        progress: module.progress ?? 0,
        concepts: module.concepts?.map((concept) => ({
          id: concept.id,
          title: concept.title,
          completed: concept.completed,
        })),
      };
    });

    return { modules };
  }
}
