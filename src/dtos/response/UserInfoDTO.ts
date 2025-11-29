import { UserRole } from "../../constants/userRoleTypes.js";

export interface UserResponseDTO {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}
