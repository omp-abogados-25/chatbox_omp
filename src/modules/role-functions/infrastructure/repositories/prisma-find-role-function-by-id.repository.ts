import { Injectable } from '@nestjs/common';
import { RoleFunction as PrismaRoleFunction } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractFindRoleFunctionByIdRepository, RoleFunction } from '../../domain/repositories';

// Función de mapeo para convertir el tipo de Prisma al tipo de entidad de Dominio
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
export class PrismaFindRoleFunctionByIdRepository implements AbstractFindRoleFunctionByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<RoleFunction | null> {
    const prismaRoleFunction = await this.prisma.roleFunction.findUnique({
      where: { id },
    });
    return prismaRoleFunction ? toDomainEntity(prismaRoleFunction) : null;
  }
} 