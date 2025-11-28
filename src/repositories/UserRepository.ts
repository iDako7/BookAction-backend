import { PrismaClient, User } from "../../generated/prisma/client.js";
import { RegisterDTO } from "../dtos/request/AutheticationDTO.js";

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  // find user by username
  async findByUsername(userName: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username: userName },
    });
  }

  // find user by ID
  async findByUserid(userId: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // create new user
  async create(userinfo: RegisterDTO): Promise<User> {
    // validation of user_info shall be already finished in service layer, since this layer only focus on DB related logic

    return await this.prisma.user.create({
      data: {
        email: userinfo.email,
        username: userinfo.username,
        password_hash: userinfo.password,
      },
    });
  }

  // update last login
  async updateLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { last_login: new Date() },
    });
  }
}
