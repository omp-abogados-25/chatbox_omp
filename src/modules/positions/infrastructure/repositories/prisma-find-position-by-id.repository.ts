import { Injectable } from '@nestjs/common';
import { Position as PrismaPosition } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindPositionByIdRepository, Position } from '../../domain/repositories';

function toDomainEntity(prismaPosition: PrismaPosition): Position {
  return {
    id: prismaPosition.id,
    name: prismaPosition.name,
    description: prismaPosition.description,
    created_at: prismaPosition.created_at,
    updated_at: prismaPosition.updated_at,
  };
}

@Injectable()
export class PrismaFindPositionByIdRepository implements AbstractFindPositionByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<Position | null> {
    const prismaPosition = await this.prisma.position.findUnique({
      where: { id },
    });
    return prismaPosition ? toDomainEntity(prismaPosition) : null;
  }
} 