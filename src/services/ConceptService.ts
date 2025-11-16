import { ConceptQuizzesDTO } from "../dtos/ConceptQuizzesDTO";
import type { ConceptTutorialDTO } from "../dtos/ConceptTutorialDTO";
import {
  ConceptRepository,
  ConceptRelation,
  ConceptWithTutorial,
  ConceptWithQuizzes,
} from "../repositories/ConceptRepository";
import type { Quiz } from "../../generated/prisma";

type ConceptRelationMap = {
  tutorial: ConceptWithTutorial;
  quizzes: ConceptWithQuizzes;
};

export class ConceptService {
  private conceptRepo: ConceptRepository;

  constructor(conceptRepo: ConceptRepository) {
    this.conceptRepo = conceptRepo;
  }

  private async getConceptWithRelation<T extends ConceptRelation>(
    conceptId: number,
    relation: T
  ): Promise<ConceptRelationMap[T]> {
    // relation is tutorial
    if (relation === "tutorial") {
      const concept = await this.conceptRepo.findWithTutorial(conceptId);

      if (!concept || !concept.tutorial) {
        throw new Error(`Tutorial not found for concept ${conceptId}`);
      }

      return concept as ConceptRelationMap[T];
    }

    // relation is quizzes
    // todo: in next concept endpoint improve it with switch
    const concept = await this.conceptRepo.findWithQuizzes(conceptId);

    if (!concept || !concept.quizzes || concept.quizzes.length === 0) {
      throw new Error(`Quizzes not found for concept ${conceptId}`);
    }

    return concept as ConceptRelationMap[T];
  }

  async getTutorialInCpt(conceptId: number): Promise<ConceptTutorialDTO> {
    const concept = await this.getConceptWithRelation(conceptId, "tutorial");
    const tutorial = concept.tutorial!;

    // transform to DTO
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
        explanation: quiz.explanation,
      }));

    return { questions };
  }
}
