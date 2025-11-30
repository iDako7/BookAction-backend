import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRepository } from "../repositories/UserRepository.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { User } from "../../generated/prisma/client.js";
import {
  RegisterDTO,
  LoginDTO,
  AuthTokens,
  JWTpayload,
} from "../dtos/request/AutheticationDTO.js";

export class AuthService {
  private userRepo: UserRepository;
  private refreshTokenRepo: RefreshTokenRepository;
  private readonly saltRounds: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  // use it to make sure it match jwt's requirement as '7d' or '15min' format
  private readonly accessExpiry: jwt.SignOptions["expiresIn"];
  private readonly refreshExpiry: jwt.SignOptions["expiresIn"];

  constructor(
    userRepo: UserRepository,
    refreshTokenRepo: RefreshTokenRepository
  ) {
    // load user info
    this.userRepo = userRepo;
    this.refreshTokenRepo = refreshTokenRepo;

    // load environment variables
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");
    this.accessExpiry = (process.env.JWT_ACCESS_EXPIRY ||
      "15min") as jwt.SignOptions["expiresIn"];
    this.refreshExpiry = (process.env.JWT_REFRESH_EXPIRY ||
      "7d") as jwt.SignOptions["expiresIn"];

    const access_secret = process.env.JWT_ACCESS_SECRET;
    const refresh_secret = process.env.JWT_REFRESH_SECRET;
    if (!access_secret || !refresh_secret) {
      throw new Error(
        "JWT_ACCESS_EXPIRY or JWT_REFRESH_SECRET environment variable is missed"
      );
    }
    this.accessSecret = access_secret;
    this.refreshSecret = refresh_secret;
  }
  // helper function: generate token using user information
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTpayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // generate access token(short-lived)
    // what does each parameter do in jwt.sign()?
    // 1. payload - data to encode (NOT encrypted, just encoded)
    // 2. secret - used to create signature
    // 3. options - expiration time and other settings
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });

    // generate refresh token(long-lived)
    // Add unique jti (JWT ID) to ensure each token is unique, even for the same user
    // This allows multiple concurrent sessions and prevents unique constraint violations
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        // unique identifier for this token
        // this will allow user to login in different devices
        jti: crypto.randomUUID(),
      },
      this.refreshSecret,
      {
        expiresIn: this.refreshExpiry,
      }
    );

    // calculate expiry date for refresh token
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + parseInt(this.refreshExpiry as string)
    );

    // save the refresh_token to DB
    await this.refreshTokenRepo.create(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  // register new user
  async register(
    userInfo: RegisterDTO
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // check if email already exist
    if (await this.userRepo.findByEmail(userInfo.email)) {
      throw new Error("Email already registered");
    }
    // check if username already exist
    if (await this.userRepo.findByUsername(userInfo.username)) {
      throw new Error("User name already registered");
    }

    // hash password
    const passwordHash = await bcrypt.hash(userInfo.password, this.saltRounds);

    // create new user
    const user = await this.userRepo.create({
      email: userInfo.email,
      username: userInfo.username,
      password: passwordHash,
    });

    // generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // login
  async login(
    loginInfo: LoginDTO
  ): Promise<{ user: User; tokens: AuthTokens }> {
    let user = null;
    // find user by email or user_name
    if (loginInfo.emailOrUsername.includes("@")) {
      user = await this.userRepo.findByEmail(loginInfo.emailOrUsername);
    } else {
      user = await this.userRepo.findByUsername(loginInfo.emailOrUsername);
    }
    if (!user) {
      throw new Error("invalid user name or email");
    }
    if (!user.is_active) {
      throw new Error("user is deactivated");
    }

    // verify password
    const isPasswordValid = await bcrypt.compare(
      loginInfo.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new Error("current password isn't valid");
    }

    // update last login
    await this.userRepo.updateLogin(user.id);

    // generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // refresh access_token(short-lived)
  async refreshAccessToken(refreshToken: string): Promise<string> {
    //valid refresh_token(long-lived)
    const tokenRecord = await this.refreshTokenRepo.findUserByToken(
      refreshToken
    );

    if (!tokenRecord) {
      throw new Error("Invalid refresh token");
    }

    // generate new token
    const user = await this.userRepo.findByUserid(tokenRecord.id);

    if (!user) {
      throw new Error("User entity not found");
    }

    // generate new access_token
    const payload: JWTpayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  // logout
  async logout(refreshToken: string): Promise<void> {
    // valid refresh token
    const tokenRecord = await this.refreshTokenRepo.findUserByToken(
      refreshToken
    );

    if (!tokenRecord) {
      throw new Error("invalid token");
    }

    // delete refresh token in DB
    await this.refreshTokenRepo.deleteToken(refreshToken);
  }

  // verify access token
  async verifyAccessToken(token: string): Promise<JWTpayload> {
    return jwt.verify(token, this.accessSecret) as JWTpayload;
  }

  // get user by id
  async getUserById(userId: number): Promise<User | null> {
    return this.userRepo.findByUserid(userId);
  }
}
