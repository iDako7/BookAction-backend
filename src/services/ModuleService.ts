import { ModuleRepository } from "../repositories/ModuleRepository";
import type { ThemeDTO } from "../dtos/ThemeDTO";
import type { ConceptTutorialDTO } from "../dtos/ConceptTutorialDTO";
import { ConceptRepository } from "../repositories/ConceptRepository";

export class ModuleService {
  private moduleRepo: ModuleRepository;
  private conceptRepo: ConceptRepository;

  constructor(moduleRepo: ModuleRepository, conceptRepo: ConceptRepository) {
    this.moduleRepo = moduleRepo;
    this.conceptRepo = conceptRepo;
  }

  async getModuleTheme(
    moduleId: number,
    conceptId: number
  ): Promise<ThemeDTO | ConceptTutorialDTO> {
    // 1. get the data from repo
    const module = await this.moduleRepo.findModuleWithTheme(moduleId);
    const concept = await this.conceptRepo.findConceptWithQuizzes(conceptId);

    // 2. validation
    if (!module || !module.theme) {
      throw new Error("Theme not found for module" + moduleId);
    }

    if (!concept || !concept.quizzes) {
      throw new Error("Theme not found for concept" + conceptId);
    }

    const tutorial = concept.tutorial;
    if (!tutorial) {
      throw new Error("Tutorial not found for concept " + conceptId);
    }

    // 3. transform to DTO
    const themeDTO: ThemeDTO = {
      title: module.theme.title,
      context: module.theme.context,
      mediaUrl: module.theme.media_url,
      mediaType: module.theme.media_type,
      question: module.theme.question,
    };

    const conceptDTO: ConceptTutorialDTO = {
      title: concept.title,
      definition: concept.definition,
      whyItWorks: concept.why_it_works,
      tutorial: {
        goodExample: {
          story: tutorial.good_story,
          mediaUrl: tutorial.good_media_url,
        },
        badExample: {
          story: tutorial.bad_story,
          mediaUrl: tutorial.bad_media_url,
        },
      },
    };

    return { themeDTO, conceptDTO };
  }
}
