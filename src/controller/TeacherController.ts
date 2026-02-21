import { Request, Response } from "express";
import { TeacherService } from "../services/TeacherService.js";
import { AppError } from "../utils/errors.js";

export class TeacherController {
  private service: TeacherService;

  constructor(service: TeacherService) {
    this.service = service;
  }

  async listStudents(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await this.service.listStudents(page, limit, search);
    res.json(result);
  }

  async getStudentDetail(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid student ID", 400);
    }

    const result = await this.service.getStudentDetail(id);
    res.json(result);
  }

  async getClassOverview(req: Request, res: Response): Promise<void> {
    const result = await this.service.getClassOverview();
    res.json(result);
  }

  async getModuleReport(req: Request, res: Response): Promise<void> {
    const moduleId = parseInt(req.params.id);
    if (isNaN(moduleId)) {
      throw new AppError("Invalid module ID", 400);
    }

    const result = await this.service.getModuleReport(moduleId);
    res.json(result);
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    const csv = await this.service.exportReport();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="report.csv"');
    res.send(csv);
  }
}
