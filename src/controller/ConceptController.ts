import { Request, Response } from "express";
import { ConceptService } from "../services/ConceptService";

export class TutorialController {
  private conceptService: ConceptService;

  constructor(conceptService: ConceptService) {
    this.conceptService = conceptService;
  }

  async getConceptTutorial(req: Request, res: Response): Promise<void> {
    try {
      // get valid concept id
      const conceptId = parseInt(req.params.conceptId || "");

      if (isNaN(conceptId)) {
        res.status(400).json({ error: "Invalid concept ID" });
        return;
      }
      // get tutorial
      const tutorial = await this.conceptService.getTutorialInCpt(conceptId);

      // send tutorial
      res.json(tutorial);
      console.log("Error getting concept tutorial", error);
      console.log("Error getting theme", error);
      res.status(500).json({ error: error.message });
    }
  }
}
