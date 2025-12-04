import { Request, Response } from "express";
import { ModuleService } from "../services/ModuleService.js";

export class ModuleController {
  // dependency injection, not the same as private xxx = new ModuleService()
  private moduleService: ModuleService;

  constructor(moduleService: ModuleService) {
    this.moduleService = moduleService;
  }

  async getModuleTheme(req: Request, res: Response): Promise<void> {
    try {
      // get moduleId from URL and parse
      const moduleId = parseInt(req.params.moduleId || "");

      // check if valid number
      if (isNaN(moduleId)) {
        res.status(400).json({ error: "Invalid module ID" });
        return;
      }

      // call service
      const theme = await this.moduleService.getModuleTheme(moduleId);

      // send response
      res.json(theme);
    } catch (error: any) {
      console.error("Error getting theme:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async getModulesOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User information not found in token" });
        return;
      }

      const moduleOverview = await this.moduleService.getModulesOverview(
        Number(userId)
      );
      res.json(moduleOverview);
    } catch (error: any) {
      console.error("Error getting theme:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async getModuleReflection(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = parseInt(req.params.moduleId || "");

      if (isNaN(moduleId)) {
        res.status(400).json({ error: "Invalid module ID" });
        return;
      }

      const reflection = await this.moduleService.getModuleReflection(moduleId);
      res.json(reflection);
    } catch (error: any) {
      console.error("Error getting reflection:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async saveModuleReflection(req: Request, res: Response): Promise<void> {
    try {
      // get and validate moduleId
      const moduleId = parseInt(req.params.moduleId || "");

      if (isNaN(moduleId)) {
        res.status(400).json({ error: "Invalid module ID" });
        return;
      }

      // validate required field
      const { reflectionId, userId, answer, timeSpent } = req.body;
      if (!reflectionId || !userId || !answer) {
        res.status(400).json({ error: "Missing required field(s)" });
        return;
      }

      // save data using method in service layer
      await this.moduleService.saveModuleReflection(
        reflectionId,
        userId,
        answer,
        timeSpent
      );

      // send success response
      res.status(200).json({
        message: "Reflection saved successfully",
        reflectionId,
        userId,
        answer,
        timeSpent,
      });
    } catch (error: any) {
      console.error("Error getting reflection:", error);
      res.status(404).json({ error: error.message });
    }
  }
}
