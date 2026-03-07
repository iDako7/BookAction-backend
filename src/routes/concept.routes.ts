import { Router } from "express";
import { ConceptController } from "../controller/ConceptController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createConceptRoutes(conceptController: ConceptController) {
  const router = Router();

  // Protect all routes
  router.use(authMiddleware);

  router.get("/:conceptId/tutorial", (req, res, next) =>
    conceptController.getConceptTutorial(req, res).catch(next)
  );

  router.get("/:conceptId/quiz", (req, res, next) =>
    conceptController.getConceptQuizzes(req, res).catch(next)
  );

  router.get("/:conceptId/summary", (req, res, next) =>
    conceptController.getConceptSummary(req, res).catch(next)
  );

  router.post("/quiz/:quizId/answer", (req, res, next) =>
    conceptController.saveUserQuizAns(req, res).catch(next)
  );

  router.post("/:conceptId/progress", (req, res, next) =>
    conceptController.updateConceptProgress(req, res).catch(next)
  );

  return router;
}
