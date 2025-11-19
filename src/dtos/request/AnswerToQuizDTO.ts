import type { ResponseType } from "../../constants/responseTypes";

/**
 * Basic JSON-compatible type that mirrors Prisma's JsonValue so we can shape
 * the payload that gets persisted in User_response.answer.
 */
type JsonPrimitive = string | number | boolean;
export type QuizAnswerValue =
  | JsonPrimitive
  | JsonPrimitive[]
  | { [key: string]: QuizAnswerValue };

/**
 * DTO used when a learner submits an answer to a quiz that belongs to a concept.
 * Each field maps directly to the columns on the User_response schema so the
 * service layer can persist it without ambiguity.
 */
export interface AnswerToQuizDTO {
  quizId: number;

  userId: number;

  responseType: ResponseType;

  /**
   * Structured answer data saved into User_response.answer (JSONB).
   * For multiple choice this could be the selected option index/value;
   * for other question types it can capture whatever structure is needed.
   */
  answer: QuizAnswerValue;

  isCorrect?: boolean;

  timeSpentSeconds?: number;
}
