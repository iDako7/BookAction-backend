import { ConceptQuizzesDTO } from "../dtos/ConceptQuizzesDTO";
import type { ConceptTutorialDTO } from "../dtos/ConceptTutorialDTO";
import { ConceptRepository } from "../repositories/ConceptRepository";

export class ConceptService {
  private conceptRepo: ConceptRepository;

  constructor(conceptRepo: ConceptRepository) {
    this.conceptRepo = conceptRepo;
  }

  // get tutorial
  async getTutorialInCpt(conceptId: number): Promise<ConceptTutorialDTO> {
    // 1. get the data from repo
    const concept = await this.conceptRepo.findEntityWithCpt(conceptId);

    // 2. validation
    if (!concept || !concept.quizzes) {
      throw new Error("Concept or quizzes not found for concept " + conceptId);
    }

    const tutorial = concept.tutorial;
    if (!tutorial) {
      throw new Error("Tutorial not found for concept " + conceptId);
    }

    // 3. transform to DTO
    const conceptTutorialDTO: ConceptTutorialDTO = {
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

    return conceptTutorialDTO;
  }

  // get quizzes
  async getQuizzesInCpt(conceptId: number): Primise<ConceptQuizzesDTO> {
    // 1. get the
  }
}
