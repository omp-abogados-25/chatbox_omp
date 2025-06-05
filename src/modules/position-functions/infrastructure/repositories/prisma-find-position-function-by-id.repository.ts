import { Injectable } from '@nestjs/common';
import { PositionFunction as PrismaPositionFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindPositionFunctionByIdRepository, PositionFunction } from '../../domain/repositories';

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
export class PrismaFindPositionFunctionByIdRepository implements AbstractFindPositionFunctionByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<PositionFunction | null> {
    const prismaEntity = await this.prisma.positionFunction.findUnique({
      where: { id },
    });
    return prismaEntity ? toDomainEntity(prismaEntity) : null;
  }
} 