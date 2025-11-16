import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService";

export class TutorialController {
  private conceptService: ConceptService;

  constructor(conceptService: ConceptService) {
    this.conceptService = conceptService;
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
      // get valid concept id

      const conceptId = this.parseConceptId(req, res);

      if (!conceptId) {
        return;
      }
      // get tutorial
      const tutorial = await this.conceptService.getTutorialInCpt(conceptId);
      // send tutorial
      res.json(tutorial);
    } catch (error: any) {
      console.log("Error getting concept tutorial", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getConceptQuizzes(req: Request, res: Response): Promise<void> {
    try {
    } catch (err: any) {}
  }
}
