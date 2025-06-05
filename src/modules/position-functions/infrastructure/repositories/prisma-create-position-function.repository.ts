import { Injectable } from '@nestjs/common';
import { PositionFunction as PrismaPositionFunction, Prisma } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractCreatePositionFunctionRepository, CreatePositionFunctionInput, PositionFunction } from '../../domain/repositories';

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
export class PrismaCreatePositionFunctionRepository implements AbstractCreatePositionFunctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreatePositionFunctionInput): Promise<PositionFunction | null> {
    try {
      const prismaEntity = await this.prisma.positionFunction.create({
        data: {
          positionId: data.positionId,
          roleFunctionId: data.roleFunctionId,
        },
      });
      return toDomainEntity(prismaEntity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          console.warn(
            `Attempted to insert duplicate PositionFunction: positionId=${data.positionId}, roleFunctionId=${data.roleFunctionId}. Skipping.`,
          );
          return null;
        }
      }
      throw error;
    }
  }
} 