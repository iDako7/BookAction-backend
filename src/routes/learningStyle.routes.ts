import { Router } from "express";
import { LearningStyleController } from "../controller/LearningStyleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createLearningStyleRoutes(
  controller: LearningStyleController
): Router {
  const router = Router();

  // GET /api/learning-style/questions — returns hardcoded questions
  router.get("/questions", authMiddleware, (req, res, next) =>
    controller.getQuestions(req, res).catch(next)
  );

  // POST /api/learning-style/submit — submit quiz responses
  router.post("/submit", authMiddleware, (req, res, next) =>
    controller.submitQuiz(req, res).catch(next)
  );

  // GET /api/learning-style/profile — get saved profile
  router.get("/profile", authMiddleware, (req, res, next) =>
    controller.getProfile(req, res).catch(next)
  );

  return router;
}
