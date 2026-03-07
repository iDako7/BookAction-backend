import { LearningStyle } from "../../generated/prisma/client.js";
import { AIProviderFactory } from "./ai/AIProviderFactory.js";
import type { AIMessage } from "./ai/AIProvider.js";
import { LearningProfileRepository } from "../repositories/LearningProfileRepository.js";
import { PracticeCacheRepository, PracticeQuestion } from "../repositories/PracticeCacheRepository.js";
import { ConceptRepository } from "../repositories/ConceptRepository.js";
import { AppError } from "../utils/errors.js";

export class PracticeGeneratorService {
  private profileRepo: LearningProfileRepository;
  private cacheRepo: PracticeCacheRepository;
  private conceptRepo: ConceptRepository;

  constructor(
    profileRepo: LearningProfileRepository,
    cacheRepo: PracticeCacheRepository,
    conceptRepo: ConceptRepository
  ) {
    this.profileRepo = profileRepo;
    this.cacheRepo = cacheRepo;
    this.conceptRepo = conceptRepo;
  }

  async generatePractice(
    conceptId: number,
    userId: number
  ): Promise<{ questions: PracticeQuestion[] }> {
    // 1. Verify concept exists
    const concept = await this.conceptRepo.findWithQuizzes(conceptId);
    if (!concept) {
      throw new AppError("Concept not found", 404);
    }

    // 2. Get user's learning style (default to VISUAL if no profile)
    const profile = await this.profileRepo.findByUserId(userId);
    const learningStyle: LearningStyle = profile
      ? (profile.primaryStyle as LearningStyle)
      : LearningStyle.VISUAL;

    // 3. Check cache
    const cached = await this.cacheRepo.findValid(conceptId, learningStyle);
    if (cached) {
      return { questions: cached };
    }

    // 4. Call AI (factory reads env per request — supports mock/mock-failing)
    const aiProvider = AIProviderFactory.create();

    try {
      const messages: AIMessage[] = [
        {
          role: "system",
          content: `You are an educational AI that generates practice quiz questions.
Generate exactly 3 multiple-choice questions about the given concept, tailored for a ${learningStyle} learner.
Return a JSON array (not an object) with exactly 3 items. Each item must have:
- question: string
- options: array of exactly 3 strings
- correct_option_index: number (0, 1, or 2)
- explanation: string`,
        },
        {
          role: "user",
          content: `Generate 3 practice questions for this concept:
Title: ${concept.title}
Definition: ${concept.definition}
Why it works: ${concept.why_it_works}`,
        },
      ];

      const questions = await aiProvider.completeJSON<PracticeQuestion[]>(messages);

      // 5. Store in cache
      await this.cacheRepo.upsert(conceptId, learningStyle, questions);

      return { questions };
    } catch (_err) {
      // 6. Fallback: return existing quiz records for this concept
      const fallbackQuestions: PracticeQuestion[] = concept.quizzes.map((q) => ({
        question: q.question,
        options: (q.options as string[]),
        correct_option_index: q.correct_option_index[0] ?? 0,
        explanation: q.explanation,
      }));

      return { questions: fallbackQuestions };
    }
  }
}
