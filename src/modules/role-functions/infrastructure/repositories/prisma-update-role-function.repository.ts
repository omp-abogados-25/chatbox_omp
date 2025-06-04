import { Injectable } from '@nestjs/common';
import { RoleFunction as PrismaRoleFunction } from '@prisma/client';
import { AbstractUpdateRoleFunctionRepository, UpdateRoleFunctionInput, RoleFunction } from '../../domain/repositories';
import { PrismaService } from 'src/integrations/prisma';

function toDomainEntity(prismaEntity: PrismaRoleFunction): RoleFunction {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    details: prismaEntity.details,
    notes: prismaEntity.notes,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
  };
}

@Injectable()
export class PrismaUpdateRoleFunctionRepository implements AbstractUpdateRoleFunctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, data: UpdateRoleFunctionInput): Promise<RoleFunction | null> {
    try {
      const prismaRoleFunction = await this.prisma.roleFunction.update({
        where: { id },
        data: {
          details: data.details,
          notes: data.notes,
        },
      });
      return toDomainEntity(prismaRoleFunction);
    } catch (error) {
      if (error.code === 'P2025') { 
        return null;
      }
      throw error;
    }
  }
} 