import { Request, Response } from "express";
import { ModuleService } from "../services/ModuleService";

export class ModuleController {
  private moduleService: ModuleService;

  constructor(moduleService: ModuleService) {
    this.moduleService = moduleService;
  }

  async getTheme(req: Request, res: Response): Promise<void> {
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
}
