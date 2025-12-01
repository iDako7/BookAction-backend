import { Router } from "express";
import { ModuleController } from "../controller/ModuleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createModuleRoutes(moduleController: ModuleController) {
  const router = Router();

  // Protect all routes
  router.use(authMiddleware);

  router.get("/:moduleId/theme", async (req, res) => {
    moduleController.getModuleTheme(req, res);
  });

  router.get("/:moduleId/reflection", async (req, res) => {
    moduleController.getModuleReflection(req, res);
  });

  router.get("/overview", async (req, res) => {
    moduleController.getModulesOverview(req, res);
  });

  router.post("/:moduleId/reflection", async (req, res) => {
    moduleController.saveModuleReflection(req, res);
  });

  return router;
}
