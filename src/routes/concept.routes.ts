import { Router } from "express";
import { ConceptRepository } from "../repositories/ConceptRepository";
import { ConceptService } from "../services/ConceptService";
import { ConceptController } from "../controller/ConceptController";
import prisma from "../lib/prisma";

const router = Router();

const conceptRepo = new ConceptRepository(prisma);
const conceptService = new ConceptService(conceptRepo);
const conceptController = new ConceptController(conceptService);

router.get("/concepts/:conceptId/tutorial", async (req, res) => {
  conceptController.getConceptTutorial(req, res);
});

router.get("/concepts/:conceptId/quiz", async (req, res) => {
  conceptController.getConceptQuizzes(req, res);
});

router.get("/concepts/:conceptId/summary", async (req, res) => {
  conceptController.getConceptSummary(req, res);
});

export default router;
