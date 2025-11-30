import { PrismaClient } from "../../generated/prisma/client.js";
import type { UpdateProgressDTO } from "../dtos/request/UpdateProgressDTO.js";

export class UserProgressRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Upserts (creates or updates) the user's progress for a specific concept.
   * Handles the requirement of fetching the concept's order_index first.
   */
  async upsertProgress(conceptId: number, data: UpdateProgressDTO) {
    return this.prisma.user_concept_progress.upsert({
      where: {
        concept_id_user_id: {
          concept_id: conceptId,
          user_id: data.userId,
        },
      },
      update: {
        completed: data.isCompleted,
        time_spent: data.timeSpent ?? undefined,
        completed_at: data.isCompleted ? new Date() : null,
      },
      create: {
        concept_id: conceptId,
        user_id: data.userId,
        // order_index: 0, // Removed as it does not exist in schema
        completed: data.isCompleted,
        time_spent: data.timeSpent ?? 0,
        completed_at: data.isCompleted ? new Date() : null,
      },
    });
  }
}
