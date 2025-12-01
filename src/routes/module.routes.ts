import { Router } from "express";
import { ModuleController } from "../controller/ModuleController.js";

export function createModuleRoutes(moduleController: ModuleController) {
  const router = Router();

  router.get("/modules/:moduleId/theme", async (req, res) => {
    moduleController.getModuleTheme(req, res);
  });

  router.get("/modules/:moduleId/reflection", async (req, res) => {
    moduleController.getModuleReflection(req, res);
  });

  router.get("/modules/overview", async (req, res) => {
    moduleController.getModulesOverview(req, res);
  });

  router.post("/modules/:moduleId/reflection", async (req, res) => {
    moduleController.saveModuleReflection(req, res);
  });

  return router;
}
