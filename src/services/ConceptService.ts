import { RESPONSE_TYPES } from "../constants/responseTypes.js";
import type { ResponseType } from "../constants/responseTypes.js";
import type { QuizAnswerValue } from "../dtos/request/AnswerToQuizDTO.js";
import { ConceptQuizzesDTO } from "../dtos/response/ConceptQuizzesDTO.js";
import { ConceptSummaryDTO } from "../dtos/response/ConceptSummaryDTO.js";
import type { ConceptTutorialDTO } from "../dtos/response/ConceptTutorialDTO.js";
import {
  ConceptRepository,
  ConceptSubTypes,
  ConceptRelationMap,
} from "../repositories/ConceptRepository.js";

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
        id: quiz.id,
        orderIndex: quiz.order_index,
        question: quiz.question,
        questionType: quiz.question_type,
        mediaUrl: quiz.media_url,
        options: quiz.options as string[],
        correctOptionIndex: quiz.correct_option_index,
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

  async saveQuizAnswers(
    quiz_type: ResponseType,
    quiz_id: number,
    user_id: number,
    userAnswer: number[],
    time_spent: number | null
  ): Promise<QuizAnswerValue> {
    // validate user's answer
    if (userAnswer.length === 0) {
      throw new Error("Answer must be a non-empty array of option indices");
    }

    // get the standard answer
    const quizData = await this.conceptRepo.findQuizAnswer(quiz_id);

    if (!quizData) {
      throw new Error(`Answer of quiz ${quiz_id} not found`);
    }

    const { standardAnswer, realQuizType } = quizData;

    // calculate score
    const { score, isCorrect } = this.calculateScore(
      userAnswer,
      standardAnswer,
      realQuizType as ResponseType
    );

    // prepare answer JSON
    const answerPayload: QuizAnswerValue = {
      userAnswerIndices: userAnswer,
      correctOptionIndices: standardAnswer,
      score: score,
    };

    await this.conceptRepo.saveQuizAnswersToDB({
      quizId: quiz_id,
      userId: user_id,
      responseType: quiz_type,
      answer: answerPayload,
      isCorrect,
      timeSpentSeconds: time_spent ?? undefined,
    });

    return answerPayload;
  }

  private calculateScore(
    userAnswer: number[],
    standardAnswer: number[],
    quizType: ResponseType
  ): { score: number; isCorrect: boolean } {
    if (quizType === RESPONSE_TYPES.SINGLE_QUIZ) {
      const isCorrect = userAnswer[0] === standardAnswer[0];
      const score = isCorrect ? 1 : 0;
      return { score, isCorrect };
    } else if (quizType === RESPONSE_TYPES.MULTIPLE_QUIZ) {
      // Calculate intersection (correct answers)
      const correctAnswers = userAnswer.filter((ans) =>
        standardAnswer.includes(ans)
      );

      // Score based on correct answers / total possible answers
      const score = correctAnswers.length / standardAnswer.length;

      // Consider correct only if all answers match
      const isCorrect =
        userAnswer.length === standardAnswer.length &&
        standardAnswer.every((answer) => userAnswer.includes(answer));

      return { score, isCorrect };
    } else {
      throw new Error(`Unsupported quiz type: ${quizType}`);
    }
  }
}
