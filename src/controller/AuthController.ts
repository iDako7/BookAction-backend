import { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";
import { User } from "../../generated/prisma/client.js";
import { UserResponseDTO } from "../dtos/response/UserInfoDTO.js";
import { UserRole } from "../constants/userRoleTypes.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  RegisterInput,
  LoginInput,
} from "../validation/authValidation.js";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // transfer user detail info into user_info for response without sensitive info
  private mapUserToDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      // parse and validate request body

      const regData = registerSchema.parse(req.body);

      // register user
      // ! regData's type should be RegisterInput, but it passed the type validation of register method which require RegisterDTO, how?
      const { user: newUser, token: newUserTokens } =
        await this.authService.register(regData);

      // prepare response
      const userRes = this.mapUserToDTO(newUser);

      // Set refresh token as httpOnly cookie
      // ! how it works
      res.cookie("refreshToken", newUserTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // send response
      res.status(201).json({
        success: true,
        message: "registration successful",
        data: {
          user: userRes,
          accessToken: newUserTokens.accessToken,
        },
      });
    } catch (error: any) {
      console.error("registration error:", error);

      if (error.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "validation failed",
          // ! what is errors? why don't use error
          errors: error.errors,
        });
        return;
      }

      // Handle other errors
      res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  }
}
