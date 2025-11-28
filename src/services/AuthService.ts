import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
    // what does each parameter do? 1. encrypted data, 2. secret key 3. optional, how long the token will expire
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });

    // generate refresh token(long-lived)
    const refreshToken = jwt.sign({ userId: user.id }, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });

    // calculate expiry date for refresh token
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + parseInt(this.refreshExpiry as string)
    );

    // save the refresh token to DB
    await this.refreshTokenRepo.create(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  // register new user
  async register(
    userInfo: RegisterDTO
  ): Promise<{ user: User; token: AuthTokens }> {
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
    const token = await this.generateTokens(user);

    return { user, token };
  }
}
