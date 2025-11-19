import { UserProgressRepository } from "../repositories/UserProgressRepository";
import type { UpdateProgressDTO } from "../dtos/request/UpdateProgressDTO";

export class UserProgressService {
  private progressRepo: UserProgressRepository;

  constructor(progressRepo: UserProgressRepository) {
    this.progressRepo = progressRepo;
  }

  async saveProgress(conceptId: number, data: UpdateProgressDTO) {
    // Basic validation
    if (!data.userId) {
      throw new Error("User ID is required");
    }

    // Call repository to upsert
    return await this.progressRepo.upsertProgress(conceptId, data);
  }
}
