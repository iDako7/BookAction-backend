import { Router } from "express";
import { TeacherController } from "../controller/TeacherController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

export function createTeacherRoutes(teacherController: TeacherController) {
  const router = Router();

  // Apply auth + role guard to ALL teacher routes
  router.use(authMiddleware);
  router.use(requireRole("TEACHER", "ADMIN"));

  // NOTE: /reports/export must come BEFORE /students/:id to avoid route collision
  router.get("/students", (req, res, next) =>
    teacherController.listStudents(req, res).catch(next)
  );
  router.get("/reports/export", (req, res, next) =>
    teacherController.exportReport(req, res).catch(next)
  );
  router.get("/students/:id", (req, res, next) =>
    teacherController.getStudentDetail(req, res).catch(next)
  );
  router.get("/overview", (req, res, next) =>
    teacherController.getClassOverview(req, res).catch(next)
  );
  router.get("/modules/:id/report", (req, res, next) =>
    teacherController.getModuleReport(req, res).catch(next)
  );

  return router;
}
