import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { ModuleService } from "../services/ModuleService";
import { ModuleController } from "../controller/ModuleController";

const router = Router();

const prisma = new PrismaClient();
const moduleRepo = new ModuleRepository(prisma);
const moduleService = new ModuleService(moduleRepo);
const moduleController = new ModuleController(moduleService);

router.get("/modules/:moduleId/theme", async (req, res) => {
  moduleController.getTheme(req, res);
});

export default router;
