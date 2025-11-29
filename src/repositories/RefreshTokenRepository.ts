import { PrismaClient, RefreshToken } from "../../generated/prisma/client.js";

export class RefreshTokenRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // create refresh token
  async create(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: token,
        expires_at: expiresAt,
      },
    });
  }

  // find valid refresh token
  async findUserByToken(token: string): Promise<RefreshToken | null> {
    const user = await this.prisma.refreshToken.findUnique({
      where: { token: token },
      include: { user: true },
    });

    if (user && user.expires_at > new Date()) {
      return user;
    } else {
      return null;
    }
  }

  // delete refresh token while user logout
  async deleteToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token: token },
    });
  }

  // clean up expired tokens
  // do we need this? YES, It prevents database bloat and improves performance.
  // Call this periodically (e.g., daily via cron job), not on every request.
  // Returns the count of deleted tokens for logging purposes.
  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date(), // lt = less than current date
        },
      },
    });
  }

  // delete all tokens for a specific user
  // Useful for forcing logout on all devices or limiting concurrent sessions
  async deleteUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        user_id: userId,
      },
    });
  }
}
