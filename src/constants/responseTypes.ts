/**
 * Response types for user interactions
 */
export const RESPONSE_TYPES = {
  QUIZ: "quiz",
  REFLECTION: "reflection",
} as const;

/**
 * Type-safe response type union
 */

export type ResponseType = (typeof RESPONSE_TYPES)[keyof typeof RESPONSE_TYPES];
