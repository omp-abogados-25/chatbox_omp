import { Injectable } from '@nestjs/common';
import { RoleFunction as PrismaRoleFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindAllRoleFunctionsRepository, RoleFunction } from '../../domain/repositories';

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
export class PrismaFindAllRoleFunctionsRepository implements AbstractFindAllRoleFunctionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<RoleFunction[]> {
    const prismaRoleFunctions = await this.prisma.roleFunction.findMany();
    return prismaRoleFunctions.map(toDomainEntity);
  }
} 