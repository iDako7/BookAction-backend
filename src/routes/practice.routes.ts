import { Router } from "express";
import { PracticeController } from "../controller/PracticeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createPracticeRoutes(controller: PracticeController): Router {
  const router = Router();

  // POST /api/practice/generate — generate AI practice questions
  router.post("/generate", authMiddleware, (req, res, next) =>
    controller.generatePractice(req, res).catch(next)
  );

  // POST /api/practice/check — check practice answers
  router.post("/check", authMiddleware, (req, res, next) =>
    controller.checkAnswers(req, res).catch(next)
  );

  return router;
}
