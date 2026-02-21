import { Request, Response } from "express";
import { PracticeGeneratorService } from "../services/PracticeGeneratorService.js";

export class PracticeController {
  private practiceGeneratorService: PracticeGeneratorService;

  constructor(practiceGeneratorService: PracticeGeneratorService) {
    this.practiceGeneratorService = practiceGeneratorService;
  }

  async generatePractice(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId as number;
    const { conceptId } = req.body as { conceptId: number };

    const result = await this.practiceGeneratorService.generatePractice(
      Number(conceptId),
      userId
    );

    res.status(200).json(result);
  }

  async checkAnswers(req: Request, res: Response): Promise<void> {
    // Placeholder for answer checking endpoint
    res.status(200).json({ message: "Answer checking not implemented yet" });
  }
}
