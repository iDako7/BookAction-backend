import { Request, Response } from "express";
import { ModuleService } from "../services/ModuleService.js";
import { AppError } from "../utils/errors.js";

export class ModuleController {
  private moduleService: ModuleService;

  constructor(moduleService: ModuleService) {
    this.moduleService = moduleService;
  }

  async getModuleTheme(req: Request, res: Response): Promise<void> {
    const moduleId = parseInt(req.params.moduleId || "");
    if (isNaN(moduleId)) {
      throw new AppError("Invalid module ID", 400);
    }

    const theme = await this.moduleService.getModuleTheme(moduleId);
    res.json(theme);
  }

  async getModulesOverview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("User information not found in token", 401);
    }

    const moduleOverview = await this.moduleService.getModulesOverview(
      Number(userId)
    );
    res.json(moduleOverview);
  }

  async getModuleReflection(req: Request, res: Response): Promise<void> {
    const moduleId = parseInt(req.params.moduleId || "");
    if (isNaN(moduleId)) {
      throw new AppError("Invalid module ID", 400);
    }

    const reflection = await this.moduleService.getModuleReflection(moduleId);
    res.json(reflection);
  }

  async saveModuleReflection(req: Request, res: Response): Promise<void> {
    const moduleId = parseInt(req.params.moduleId || "");
    if (isNaN(moduleId)) {
      throw new AppError("Invalid module ID", 400);
    }

    const { reflectionId, userId, answer, timeSpent } = req.body;
    if (!reflectionId || !userId || !answer) {
      throw new AppError("Missing required field(s)", 400);
    }

    await this.moduleService.saveModuleReflection(
      reflectionId,
      userId,
      answer,
      timeSpent
    );

    res.status(200).json({
      message: "Reflection saved successfully",
      reflectionId,
      userId,
      answer,
      timeSpent,
    });
  }
}
