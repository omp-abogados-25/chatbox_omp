import { Injectable } from '@nestjs/common';
import { PositionFunction as PrismaPositionFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractDeletePositionFunctionRepository, PositionFunction } from '../../domain/repositories';

function toDomainEntity(prismaEntity: PrismaPositionFunction): PositionFunction {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    positionId: prismaEntity.positionId,
    roleFunctionId: prismaEntity.roleFunctionId,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
  };
}

@Injectable()
export class PrismaDeletePositionFunctionRepository implements AbstractDeletePositionFunctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<PositionFunction | null> {
    try {
      const prismaEntity = await this.prisma.positionFunction.delete({
        where: { id },
      });
      return toDomainEntity(prismaEntity);
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
} 