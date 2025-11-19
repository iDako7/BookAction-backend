/**
 * Response types for user interactions
 */
export const RESPONSE_TYPES = {
  SINGLE_QUIZ: "single_choice",
  MULTIPLE_QUIZ: "multiple_choice",
  REFLECTION: "reflection",
} as const;

/**
 * Type-safe response type union
 */

export type ResponseType = (typeof RESPONSE_TYPES)[keyof typeof RESPONSE_TYPES];
