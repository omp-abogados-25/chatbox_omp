import { Injectable } from '@nestjs/common';
import { PositionFunction as PrismaPositionFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindAllPositionFunctionsRepository, PositionFunction } from '../../domain/repositories';

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
export class PrismaFindAllPositionFunctionsRepository implements AbstractFindAllPositionFunctionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PositionFunction[]> {
    const prismaEntities = await this.prisma.positionFunction.findMany();
    return prismaEntities.map(toDomainEntity);
  }
} 