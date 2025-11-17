import { ConceptQuizzesDTO } from "../dtos/ConceptQuizzesDTO";
import { ConceptSummaryDTO } from "../dtos/ConceptSummaryDTO";
import type { ConceptTutorialDTO } from "../dtos/ConceptTutorialDTO";
import {
  ConceptRepository,
  ConceptSubTypes,
  ConceptRelationMap,
} from "../repositories/ConceptRepository";

export class ConceptService {
  private conceptRepo: ConceptRepository;

  constructor(conceptRepo: ConceptRepository) {
    this.conceptRepo = conceptRepo;
  }

  private async getConceptWithRelation<T extends ConceptSubTypes>(
    conceptId: number,
    relation: T
  ): Promise<ConceptRelationMap[T]> {
    // return concept based on sub-entity type
    switch (relation) {
      case "tutorial":
        // find concept using method in repo layer
        const tutorialCpt = await this.conceptRepo.findWithTutorial(conceptId);

        // validation
        if (!tutorialCpt || !tutorialCpt.tutorial) {
          throw new Error(`Tutorial not found for concept ${conceptId}`);
        }

        return tutorialCpt as ConceptRelationMap[T];

      case "quizzes":
        const quizzesCpt = await this.conceptRepo.findWithQuizzes(conceptId);
        if (
          !quizzesCpt ||
          !quizzesCpt.quizzes ||
          quizzesCpt.quizzes.length === 0
        ) {
          throw new Error(`Quizzes not found for concept ${conceptId}`);
        }
        return quizzesCpt as ConceptRelationMap[T];

      case "summary":
        const summaryCpt = await this.conceptRepo.findWithSummary(conceptId);
        if (!summaryCpt || !summaryCpt.summary) {
          throw new Error(`Summary not found for concept ${conceptId}`);
        }
        return summaryCpt as ConceptRelationMap[T];

      default:
        throw new Error("No matched type for concept sub entity");
    }
  }

  async getTutorialInCpt(conceptId: number): Promise<ConceptTutorialDTO> {
    const concept = await this.getConceptWithRelation(conceptId, "tutorial");
    const tutorial = concept.tutorial!;

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
  async getQuizzesInCpt(conceptId: number): Promise<ConceptQuizzesDTO> {
    const concept = await this.getConceptWithRelation(conceptId, "quizzes");

    const questions = concept.quizzes
      .sort((a, b) => a.order_index - b.order_index)
      .map((quiz) => ({
        orderIndex: quiz.order_index,
        question: quiz.question,
        questionType: quiz.question_type,
        mediaUrl: quiz.media_url,
        options: quiz.options as string[],
        correctAnswer: quiz.correct_answer,
        correctOptionIndex: quiz.correct_option_index ?? null,
        explanation: quiz.explanation,
      }));

    return { questions };
  }

  async getSummaryInCpt(conceptId: number): Promise<ConceptSummaryDTO> {
    const concept = await this.getConceptWithRelation(conceptId, "summary");

    const summary = concept.summary!;
    const conceptSummaryDTO: ConceptSummaryDTO = {
      summaryContent: summary.summary_content,
      nextConceptIntro: summary.next_chapter_intro,
    };
    return conceptSummaryDTO;
  }
}
