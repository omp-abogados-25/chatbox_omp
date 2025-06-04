import { Injectable } from '@nestjs/common';
import { RoleFunction as PrismaRoleFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractCreateRoleFunctionRepository, CreateRoleFunctionInput, RoleFunction } from '../../domain/repositories';

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
export class PrismaCreateRoleFunctionRepository implements AbstractCreateRoleFunctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateRoleFunctionInput): Promise<RoleFunction> {
    const prismaRoleFunction = await this.prisma.roleFunction.create({
      data: {
        details: data.details,
        notes: data.notes,
      },
    });
    return toDomainEntity(prismaRoleFunction);
  }
} 