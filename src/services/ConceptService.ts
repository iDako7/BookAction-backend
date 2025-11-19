import { RESPONSE_TYPES } from "../constants/responseTypes";
import type { ResponseType } from "../constants/responseTypes";
import type { QuizAnswerValue } from "../dtos/request/AnswerToQuizDTO";
import { ConceptQuizzesDTO } from "../dtos/response/ConceptQuizzesDTO";
import { ConceptSummaryDTO } from "../dtos/response/ConceptSummaryDTO";
import type { ConceptTutorialDTO } from "../dtos/response/ConceptTutorialDTO";
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

  async saveQuizAnswers(
    quiz_type: ResponseType,
    quiz_id: number,
    user_id: number,
    answer: QuizAnswerValue,
    time_spent: number
  ) {
    const quiz = await this.conceptRepo.findQuizById(quiz_id);

    if (!quiz) {
      throw new Error(`Quiz ${quiz_id} not found`);
    }

    const optionTexts = quiz.options as string[];
    // todo complex
    const submittedOptionIndices = this.normalizeSelectedIndices(answer);

    if (submittedOptionIndices.length === 0) {
      throw new Error("Answer must include at least one option index");
    }

    // todo complex
    const correctOptionIndices = this.getCorrectOptionIndices(quiz);
    if (correctOptionIndices.length === 0) {
      throw new Error(`Quiz ${quiz_id} is missing correct answer data`);
    }

    const uniqueSubmitted = Array.from(new Set(submittedOptionIndices));
    const { score, isCorrect } = this.calculateScore(
      uniqueSubmitted,
      correctOptionIndices,
      quiz_type
    );

    // prepare answer JSON
    const answerPayload = {
      submittedOptionIndices: uniqueSubmitted,
      correctOptionIndices,
      submittedOptionTexts: uniqueSubmitted.map(
        (index) => optionTexts[index] ?? null
      ),
      correctOptionTexts: correctOptionIndices.map(
        (index) => optionTexts[index] ?? null
      ),
      score,
    };

    await this.conceptRepo.saveQuizAnswersToDB({
      quizId: quiz_id,
      userId: user_id,
      responseType: quiz_type,
      answer: answerPayload,
      isCorrect,
      timeSpentSeconds: time_spent,
    });
  }

  private normalizeSelectedIndices(answer: QuizAnswerValue): number[] {
    if (Array.isArray(answer)) {
      return answer.map((value) => Number(value)).filter((num) => !isNaN(num));
    }

    if (answer && typeof answer === "object") {
      const indices = (answer as any).selectedOptionIndices;
      if (Array.isArray(indices)) {
        return indices
          .map((value: unknown) => Number(value))
          .filter((num) => !isNaN(num));
      }

      const single = Number((answer as any).selectedOptionIndex);
      return !isNaN(single) ? [single] : [];
    }

    const fallback = Number(answer);
    return !isNaN(fallback) ? [fallback] : [];
  }

  // ! this method is severely over-engineered, need to simplify
  private getCorrectOptionIndices(quiz: {
    correct_option_index: number | null;
    correct_answer: string;
  }): number[] {
    if (typeof quiz.correct_option_index === "number") {
      return [quiz.correct_option_index];
    }

    try {
      const parsed = JSON.parse(quiz.correct_answer);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => Number(value))
          .filter((num) => !isNaN(num));
      }
      const single = Number(parsed);
      if (!isNaN(single)) {
        return [single];
      }
    } catch {
      // ignored, fallback below
    }

    const numeric = Number(quiz.correct_answer);
    return !isNaN(numeric) ? [numeric] : [];
  }

  private calculateScore(
    submitted: number[],
    correct: number[],
    quizType: ResponseType
  ): { score: number; isCorrect: boolean } {
    const correctSet = new Set(correct);
    const matches = submitted.filter((index) => correctSet.has(index)).length;
    const hasIncorrectSelection = submitted.some(
      (index) => !correctSet.has(index)
    );

    if (quizType === RESPONSE_TYPES.SINGLE_QUIZ) {
      const isCorrect =
        correct.length === 1 && matches === 1 && !hasIncorrectSelection;
      return { score: isCorrect ? 1 : 0, isCorrect };
    }

    const totalCorrect = correct.length;
    const score = totalCorrect === 0 ? 0 : matches / totalCorrect;
    const isCorrect = !hasIncorrectSelection && matches === totalCorrect;
    return { score, isCorrect };
  }
}
