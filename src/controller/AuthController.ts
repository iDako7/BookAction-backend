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
      const { user: newUser, tokens: newUserTokens } =
        await this.authService.register(regData);

      // prepare response
      const userRes = this.mapUserToDTO(newUser);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", newUserTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:
          parseInt(process.env.JWT_REFRESH_EXPIRY || "7") * 24 * 60 * 60 * 1000, // 7 days
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
          // property of Zod errors that contains the array of detailed validation issues
          // like "invalid email", "password too short"
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

  // login endpoint
  async login(req: Request, res: Response): Promise<void> {
    try {
      // parse and validate login data
      const loginData = loginSchema.parse(req.body);

      // call auth service to login
      const { user: loginUser, tokens: loginTokens } =
        await this.authService.login({
          emailOrUsername: loginData.emailOrUsername,
          password: loginData.password,
        });

      // ! prepare response(the same logic as register)
      const userRes = this.mapUserToDTO(loginUser);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", loginTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:
          parseInt(process.env.JWT_REFRESH_EXPIRY || "7") * 24 * 60 * 60 * 1000, // 7 days
      });

      // send response
      res.json({
        success: true,
        message: "registration successful",
        data: {
          user: userRes,
          accessToken: loginTokens.accessToken,
        },
      });
    } catch (error: any) {
      console.error("registration error:", error);

      if (error.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "validation failed",
          // property of Zod errors that contains the array of detailed validation issues
          // like "invalid email", "password too short"
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

  // refresh token endpoint
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // get refresh token from valid cookies or valid request body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res
          .status(400)
          .json({ success: false, message: "Refresh token required" });
        return;
      }

      // get new access token
      const newAccessToken = await this.authService.refreshAccessToken(
        refreshToken
      );

      // send response
      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          newAccessToken,
        },
      });
    } catch (error: any) {
      console.error("Refresh token error:", error);

      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
  }

  // logout endpoint
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // validate refresh token
      const refreshToken = req.cookies?.refreshToken; //  `?.` is the optional chaining operator, is validate whether cookie is not null and not undefined
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // clear cookie
      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      console.error("Logout error:", error);

      // Even if error, to prevent further error, clear cookie and return success
      res.clearCookie("refreshToken");
      res.json({
        success: false,
        message: "Frontend Logout successful with backend error",
      });
    }
  }

  // get current user endpoint
  // retrieve and return the profile information of the currently logged-in user.
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User will be attached by auth middleware, meaning:
      // this token has been verified in middleware
      const userId = parseInt((req as any).user?.userId || null);
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
        return;
      }

      // get user from data base
      const user = await this.authService.getUserById(userId);

      // validate if user exist in DB
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // transfer user_info into specific DTO without sensitive info
      const userRes = this.mapUserToDTO(user);

      // send user_info DTO as response
      res.json({
        success: true,
        data: {
          user: userRes,
        },
      });
    } catch (error: any) {
      console.error("Get current user error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get user information",
      });
    }
  }
}
