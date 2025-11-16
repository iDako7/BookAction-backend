import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService";

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
}
