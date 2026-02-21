import { Request, Response } from "express";
import { MedalService } from "../services/MedalService.js";

export class MedalController {
  private medalService: MedalService;

  constructor(medalService: MedalService) {
    this.medalService = medalService;
  }

  /**
   * GET /api/medals
   * Returns all concept and module medals for the authenticated user.
   * No try/catch — errors propagate to the global error handler.
   */
  async getMedals(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId as number;
    const summary = await this.medalService.getUserMedalSummary(userId);
    res.status(200).json(summary);
  }
}
