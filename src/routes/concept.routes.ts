import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ConceptRepository } from "../repositories/ConceptRepository";
import { ConceptService } from "../services/ConceptService";
import { ConceptController } from "../controller/ConceptController";

const router = Router();

const prisma = new PrismaClient();
const conceptRepo = new ConceptRepository(prisma);
const conceptService = new ConceptService(conceptRepo);
const conceptController = new ConceptController(conceptService);

router.get("/concepts/:conceptId/tutorial", async (req, res) => {
  conceptController.getConceptTutorial(req, res);
});

router.get("/api/concepts/:conceptId/quiz", async (req, res) => {
  conceptController.getConceptQuizzes(req, res);
});

export default router;
