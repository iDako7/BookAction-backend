import { Router } from "express";
import { ModuleController } from "../controller/ModuleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createModuleRoutes(moduleController: ModuleController) {
  const router = Router();

  // Protect all routes
  router.use(authMiddleware);

  router.get("/:moduleId/theme", (req, res, next) =>
    moduleController.getModuleTheme(req, res).catch(next)
  );

  router.get("/:moduleId/reflection", (req, res, next) =>
    moduleController.getModuleReflection(req, res).catch(next)
  );

  router.get("/overview", (req, res, next) =>
    moduleController.getModulesOverview(req, res).catch(next)
  );

  router.post("/:moduleId/reflection", (req, res, next) =>
    moduleController.saveModuleReflection(req, res).catch(next)
  );

  return router;
}
