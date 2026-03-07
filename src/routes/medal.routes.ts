import { Router } from "express";
import { MedalController } from "../controller/MedalController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createMedalRoutes(medalController: MedalController): Router {
  const router = Router();

  // GET /api/medals — requires authentication
  router.get("/", authMiddleware, (req, res, next) =>
    medalController.getMedals(req, res).catch(next)
  );

  return router;
}
