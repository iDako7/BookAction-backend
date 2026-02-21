import { Router } from "express";
import { TeacherController } from "../controller/TeacherController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

export function createTeacherRoutes(teacherController: TeacherController) {
  const router = Router();

  // Apply auth + role guard to ALL teacher routes
  router.use(authMiddleware);
  router.use(requireRole("TEACHER", "ADMIN"));

  // NOTE: /reports/export must come BEFORE /students/:id to avoid route collision
  router.get("/students", (req, res) => teacherController.listStudents(req, res));
  router.get("/reports/export", (req, res) => teacherController.exportReport(req, res));
  router.get("/students/:id", (req, res) => teacherController.getStudentDetail(req, res));
  router.get("/overview", (req, res) => teacherController.getClassOverview(req, res));
  router.get("/modules/:id/report", (req, res) => teacherController.getModuleReport(req, res));

  return router;
}
