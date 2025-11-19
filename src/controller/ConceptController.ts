import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService";
import { UserProgressService } from "../services/UserProgressService";

export class ConceptController {
  private conceptService: ConceptService;
  private userProgressService: UserProgressService; // Added dependency

  // Update constructor to accept UserProgressService
  constructor(
    conceptService: ConceptService,
    userProgressService: UserProgressService
  ) {
    this.conceptService = conceptService;
    this.userProgressService = userProgressService;
  }

  private parseConceptId(req: Request, res: Response): number | undefined {
    const conceptId = parseInt(req.params.conceptId || "");

    if (isNaN(conceptId)) {
      res.status(400).json({ error: "Invalid concept ID" });
      return undefined;
    }
    return conceptId;
  }

  async getConceptTutorial(req: Request, res: Response): Promise<void> {
    try {
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) return;

      const tutorial = await this.conceptService.getTutorialInCpt(conceptId);
      res.json(tutorial);
    } catch (error: any) {
      console.log("Error getting concept tutorial", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getConceptQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) return;

      const quizzes = await this.conceptService.getQuizzesInCpt(conceptId);
      res.json(quizzes);
    } catch (error: any) {
      console.log("Error getting concept quizzes", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getConceptSummary(req: Request, res: Response): Promise<void> {
    try {
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) return;

      const summary = await this.conceptService.getSummaryInCpt(conceptId);
      res.json(summary);
    } catch (error: any) {
      console.log("Error getting concept summary", error);
      res.status(500).json({ error: error.message });
    }
  }

  async saveUserQuizAns(req: Request, res: Response): Promise<void> {
    try {
      const quizId = parseInt(req.params.quizId || "");

      if (isNaN(quizId)) {
        res.status(400).json({ error: "Invalid quiz ID" });
        return;
      }

      const { responseType, userId, userAnswerIndices, timeSpent } = req.body;
      if (!responseType || !userAnswerIndices || !userId) {
        res.status(400).json({ error: "Missing required field(s)" });
        return;
      }

      const answerPayload = await this.conceptService.saveQuizAnswers(
        responseType,
        quizId,
        userId,
        userAnswerIndices,
        timeSpent
      );

      res.status(200).json(answerPayload);
    } catch (error: any) {
      console.log("Error saving quiz answer", error);
      res.status(500).json({ error: error.message });
    }
  }

  // New method: Update Concept Progress
  async updateConceptProgress(req: Request, res: Response): Promise<void> {
    try {
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) return;

      const { userId, isCompleted, timeSpent } = req.body;

      if (!userId || isCompleted === undefined) {
        res.status(400).json({ error: "Missing userId or isCompleted" });
        return;
      }

      const result = await this.userProgressService.saveProgress(conceptId, {
        userId,
        isCompleted,
        timeSpent,
      });

      res.json(result);
    } catch (error: any) {
      console.log("Error updating progress", error);
      res.status(500).json({ error: error.message });
    }
  }
}
