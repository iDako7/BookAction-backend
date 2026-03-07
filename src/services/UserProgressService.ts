import { UserProgressRepository } from "../repositories/UserProgressRepository.js";
import type { UpdateProgressDTO } from "../dtos/request/UpdateProgressDTO.js";
import { MedalService } from "./MedalService.js";
import { AppError } from "../utils/errors.js";

export class UserProgressService {
  private progressRepo: UserProgressRepository;
  private medalService: MedalService;

  constructor(
    progressRepo: UserProgressRepository,
    medalService: MedalService
  ) {
    this.progressRepo = progressRepo;
    this.medalService = medalService;
  }

  async saveProgress(conceptId: number, data: UpdateProgressDTO) {
    // Basic validation
    if (!data.userId) {
      throw new AppError("User ID is required", 400);
    }

    // Call repository to upsert
    const result = await this.progressRepo.upsertProgress(conceptId, data);

    // Award concept medal when concept is marked complete
    if (data.isCompleted) {
      await this.medalService.awardConceptMedal(data.userId, conceptId);
    }

    return result;
  }
}
