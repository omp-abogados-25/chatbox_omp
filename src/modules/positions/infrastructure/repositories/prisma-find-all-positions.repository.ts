import { Injectable } from '@nestjs/common';
import { Position as PrismaPosition } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindAllPositionsRepository, Position } from '../../domain/repositories';

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
export class PrismaFindAllPositionsRepository implements AbstractFindAllPositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<Position[]> {
    const prismaPositions = await this.prisma.position.findMany();
    return prismaPositions.map(toDomainEntity);
  }
} 