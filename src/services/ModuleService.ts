import { ModuleRepository } from "../repositories/ModuleRepository";
import type { ThemeDTO } from "../dtos/response/ModuleThemeDTO";
import type {
  ModulesOverviewDTO,
  ModuleOverviewDTO,
} from "../dtos/response/ModulesOverviewDTO";
import type { ReflectionDTO } from "../dtos/response/ReflectionDTO";
import type { ResponseType } from "../constants/responseTypes";

/**
 * Service layer for module-related business logic.
 * Handles data transformation between repository and controller layers.
 */
export class ModuleService {
  private moduleRepo: ModuleRepository;

  /**
   * Creates a new ModuleService instance.
   * @param moduleRepo - Repository for module data access
   */
  constructor(moduleRepo: ModuleRepository) {
    this.moduleRepo = moduleRepo;
  }

  /**
   * Retrieves the theme for a specific module.
   * @param moduleId - The ID of the module
   * @returns Theme data including title, context, media, and question
   * @throws Error if theme not found for the module
   */
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

  /**
   * Retrieves overview of all modules with their progress and concepts.
   * @returns Array of modules with themes, progress, and associated concepts
   * @throws Error if homepage data not found
   */
  async getModulesOverview(): Promise<ModulesOverviewDTO> {
    // get the necessary data through repo layer
    const homePage = await this.moduleRepo.returnModulesOverview();

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

  /**
   * Retrieves the reflection prompt for a module.
   * @param moduleId - The ID of the module
   * @param userId - The ID of the user (defaults to 1)
   * @returns Reflection prompt with optional media URL
   * @throws Error if reflection not found for the module
   */
  async getModuleReflection(
    moduleId: number,
    userId = 1
  ): Promise<ReflectionDTO> {
    const reflection = await this.moduleRepo.findModuleReflection(
      moduleId,
      userId
    );

    if (!reflection) {
      throw new Error(`Reflection not found for module ${moduleId}`);
    }

    const reflectionDTO: ReflectionDTO = {
      type: "text",
      prompt: reflection.module_summary,
      mediaUrl: reflection.module_summary_media_url,
    };

    return reflectionDTO;
  }

  /**
   * Saves a user's response to a module reflection prompt.
   * @param reflectionId - The ID of the reflection
   * @param userId - The ID of the user
   * @param answer - The user's reflection response text
   * @param timeSpent - Optional time spent in seconds
   */
  async saveModuleReflection(
    reflectionId: number,
    userId: number,
    answer: string,
    timeSpent: number | undefined = undefined
  ) {
    const resData = {
      reflectionId: reflectionId,
      userId: userId,
      responseType: "reflection" as ResponseType,
      responseText: answer,
      timeSpentSeconds: timeSpent,
    };
    await this.moduleRepo.saveModuleReflectionRes(resData);
  }
}
