import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService.js";
import { UserProgressService } from "../services/UserProgressService.js";
import { AppError } from "../utils/errors.js";

export class ConceptController {
  private conceptService: ConceptService;
  private userProgressService: UserProgressService;

  constructor(
    conceptService: ConceptService,
    userProgressService: UserProgressService
  ) {
    this.conceptService = conceptService;
    this.userProgressService = userProgressService;
  }

  private parseConceptId(req: Request): number {
    const conceptId = parseInt(req.params.conceptId || "");
    if (isNaN(conceptId)) {
      throw new AppError("Invalid concept ID", 400);
    }
    return conceptId;
  }

  async getConceptTutorial(req: Request, res: Response): Promise<void> {
    const conceptId = this.parseConceptId(req);
    const tutorial = await this.conceptService.getTutorialInCpt(conceptId);
    res.json(tutorial);
  }

  async getConceptQuizzes(req: Request, res: Response): Promise<void> {
    const conceptId = this.parseConceptId(req);
    const quizzes = await this.conceptService.getQuizzesInCpt(conceptId);
    res.json(quizzes);
  }

  async getConceptSummary(req: Request, res: Response): Promise<void> {
    const conceptId = this.parseConceptId(req);
    const summary = await this.conceptService.getSummaryInCpt(conceptId);
    res.json(summary);
  }

  async saveUserQuizAns(req: Request, res: Response): Promise<void> {
    const quizId = parseInt(req.params.quizId || "");
    if (isNaN(quizId)) {
      throw new AppError("Invalid quiz ID", 400);
    }

    const { responseType, userId, userAnswerIndices, timeSpent } = req.body;
    if (!responseType || !userAnswerIndices || !userId) {
      throw new AppError("Missing required field(s)", 400);
    }

    const answerPayload = await this.conceptService.saveQuizAnswers(
      responseType,
      quizId,
      userId,
      userAnswerIndices,
      timeSpent
    );

    res.status(200).json(answerPayload);
  }

  async updateConceptProgress(req: Request, res: Response): Promise<void> {
    const conceptId = this.parseConceptId(req);
    const { userId, isCompleted, timeSpent } = req.body;

    if (!userId || isCompleted === undefined) {
      throw new AppError("Missing userId or isCompleted", 400);
    }

    const result = await this.userProgressService.saveProgress(conceptId, {
      userId,
      isCompleted,
      timeSpent,
    });

    res.json(result);
  }
}
