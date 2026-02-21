import { Router } from "express";
import { MedalController } from "../controller/MedalController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createMedalRoutes(medalController: MedalController): Router {
  const router = Router();

  // GET /api/medals — requires authentication
  router.get("/", authMiddleware, (req, res) =>
    medalController.getMedals(req, res)
  );

  return router;
}
