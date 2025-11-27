import type { ResponseType } from "../../constants/responseTypes.js";

export interface ReflectionResDTO {
  responseType: ResponseType;
  reflectionId: number;
  userId: number;
  responseText: string;
  timeSpentSeconds?: number | undefined;
}
