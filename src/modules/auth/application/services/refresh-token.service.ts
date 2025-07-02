import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../integrations/prisma/prisma.service';
import { RefreshToken } from '../../domain/entities';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken(userId: string, token: string, tokenId: string): Promise<RefreshToken> {
    // Calcular fecha de expiración (7 días por defecto)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        isRevoked: false,
      },
    });

    return this.mapToDomainEntity(refreshToken);
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      return null;
    }

    return this.mapToDomainEntity(refreshToken);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isRevoked: true },
        ],
      },
    });
  }

  async getUserActiveTokensCount(userId: string): Promise<number> {
    return this.prisma.refreshToken.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  private mapToDomainEntity(prismaToken: any): RefreshToken {
    return {
      id: prismaToken.id,
      userId: prismaToken.userId,
      token: prismaToken.token,
      expiresAt: prismaToken.expiresAt,
      createdAt: prismaToken.created_at,
      updatedAt: prismaToken.updated_at,
      isRevoked: prismaToken.isRevoked,
    };
  }
} 