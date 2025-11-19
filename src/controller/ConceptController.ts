import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService";
import { time } from "console";

/**
 * Controller for handling concept-related tutorial and quiz requests
 */
export class ConceptController {
  private conceptService: ConceptService;

  constructor(conceptService: ConceptService) {
    this.conceptService = conceptService;
  }

  /**
   * Parses and validates the concept ID from request parameters
   * @returns The parsed concept ID if valid, undefined otherwise (response sent with error)
   */
  private parseConceptId(req: Request, res: Response): number | undefined {
    const conceptId = parseInt(req.params.conceptId || "");

    if (isNaN(conceptId)) {
      res.status(400).json({ error: "Invalid concept ID" });
      return undefined;
    }
    return conceptId;
  }

  /**
   * Retrieves the tutorial content for a specific concept
   */
  async getConceptTutorial(req: Request, res: Response): Promise<void> {
    try {
      // get valid conceptId
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) {
        return;
      }

      // return tutorial using service layer
      const tutorial = await this.conceptService.getTutorialInCpt(conceptId);
      res.json(tutorial);
    } catch (error: any) {
      console.log("Error getting concept tutorial", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retrieves quizzes associated with a specific concept
   */
  async getConceptQuizzes(req: Request, res: Response): Promise<void> {
    try {
      // get valid conceptId
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) {
        return;
      }

      // return quizzes using service layer
      const quizzes = await this.conceptService.getQuizzesInCpt(conceptId);
      res.json(quizzes);
    } catch (error: any) {
      console.log("Error getting concept tutorial", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getConceptSummary(req: Request, res: Response): Promise<void> {
    try {
      // get valid conceptId
      const conceptId = this.parseConceptId(req, res);
      if (!conceptId) {
        return;
      }

      // return quizzes using service layer
      const summary = await this.conceptService.getSummaryInCpt(conceptId);
      res.json(summary);
    } catch (error: any) {
      console.log("Error getting concept summary", error);
      res.status(500).json({ error: error.message });
    }
  }

  async saveUserQuizAns(req: Request, res: Response): Promise<void> {
    try {
      // validate quizID and userID
      const quizId = parseInt(req.params.quizId || "");

      if (isNaN(quizId)) {
        res.status(400).json({ error: "Invalid quiz ID" });
        return undefined;
      }

      // parse and validate request body
      const { responseType, userId, userAnswerIndices, timeSpent } = req.body;
      if (!responseType || !userAnswerIndices || !userId) {
        res.status(400).json({ error: "Missing required field(s)" });
        return;
      }


      // save user data
      const answerPayload = await this.conceptService.saveQuizAnswers(
        responseType,
        quizId,
        userId,
        userAnswerIndices,
        timeSpent
      );

      res.status(200).json(answerPayload);
    } catch (error: any) {
      console.log("Error getting concept summary", error);
      res.status(500).json({ error: error.message });
    }
  }
}
