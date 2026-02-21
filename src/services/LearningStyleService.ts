import { LearningStyle } from "../../generated/prisma/client.js";
import { LearningProfileRepository } from "../repositories/LearningProfileRepository.js";
import { AppError } from "../utils/errors.js";

export interface StyleResult {
  primaryStyle: string;
  scores: {
    VISUAL: number;
    VERBAL: number;
    SCENARIO: number;
  };
}

/**
 * Pure function: evaluates learning style responses and returns the primary style + scores.
 * On a tie, picks deterministically in alphabetical order (SCENARIO < VERBAL < VISUAL).
 */
export function evaluateStyle(responses: string[]): StyleResult {
  const scores = { VISUAL: 0, VERBAL: 0, SCENARIO: 0 };

  for (const r of responses) {
    const key = r as keyof typeof scores;
    if (key in scores) {
      scores[key]++;
    }
  }

  // Determine winner deterministically — sort alphabetically then pick max
  const styles: Array<keyof typeof scores> = ["SCENARIO", "VERBAL", "VISUAL"];
  let primaryStyle: keyof typeof scores = styles[0];

  for (const style of styles) {
    if (scores[style] > scores[primaryStyle]) {
      primaryStyle = style;
    }
  }

  return { primaryStyle, scores };
}

export class LearningStyleService {
  private profileRepo: LearningProfileRepository;

  constructor(profileRepo: LearningProfileRepository) {
    this.profileRepo = profileRepo;
  }

  async saveProfile(userId: number, responses: string[]): Promise<StyleResult> {
    const result = evaluateStyle(responses);

    await this.profileRepo.upsert({
      userId,
      primaryStyle: result.primaryStyle as LearningStyle,
      styleScores: result.scores,
      quizResponses: responses,
    });

    return result;
  }

  async getProfile(userId: number): Promise<StyleResult> {
    const profile = await this.profileRepo.findByUserId(userId);

    if (!profile) {
      throw new AppError("Learning style profile not found", 404);
    }

    return {
      primaryStyle: profile.primaryStyle,
      scores: profile.scores as StyleResult["scores"],
    };
  }
}
