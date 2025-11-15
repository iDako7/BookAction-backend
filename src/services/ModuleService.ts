import { ModuleRepository } from "../repositories/ModuleRepository";
import type { ThemeDTO } from "../dtos/ThemeDTO";

export class ModuleService {
  private moduleRepo: ModuleRepository; // what do we call this part of code? property, the pattern is called dependency injection

  constructor(moduleRepo: ModuleRepository) {
    this.moduleRepo = moduleRepo;
  }

  async getModuleTheme(moduleId: number): Promise<ThemeDTO> {
    // 1. get the data from repo
    const module = await this.moduleRepo.findModuleWithTheme(moduleId);

    // 2. validation
    if (!module || !module.theme) {
      throw new Error("Theme not found for module" + moduleId);
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
}
